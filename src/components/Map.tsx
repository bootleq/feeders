"use client"

import * as R from 'ramda';
import geohash from 'ngeohash';
import { nanoid } from 'nanoid';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, ReactElement, useCallback } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { useDebouncedCallback } from 'use-debounce';
import mapStyles from './map.module.scss'
import { rejectFirst } from '@/lib/utils';

import type { GeoSpotsResult, GeoSpotsByGeohash } from '@/models/spots';

import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';
import {
  userAtom,
  mapAtom,
  spotsAtom,
  mergeSpotsAtom,
  geohashesAtom,
  areaPickerAtom,
  statusAtom,
  mergeTempMarkerAtom,
} from '@/app/world/[[...path]]/store';
import { parsePath, updatePath, AREA_ZOOM_MAX, GEOHASH_PRECISION } from '@/app/world/[[...path]]/util';
import { useHydrateAtoms } from 'jotai/utils';
import { saveUserArea } from '@/app/world/[[...path]]/save-user-area';
import type { LatLngBounds } from '@/lib/schema';

import Spinner from '@/assets/spinner.svg';
import { MapIcon } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';

import SpotMarkers from '@/app/world/[[...path]]/SpotMarkers';

import Leaflet from 'leaflet';
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import TempMarker from './TempMarker';
import ResetViewControl from './ResetViewControl';
import LocateControl from './LocateControl';
import Alerts from './Alerts';
import 'leaflet/dist/leaflet.css';

const D1_PARAM_LIMIT = 100;
const AREA_PICKER_MIN_ZOOM = 14;

const setUserAreaAtom = atom(
  null,
  (get, set, update: {areaId: number, bounds: LatLngBounds}) => {
    set(userAtom, (v) => v ? R.mergeLeft(update)(v) : v)
  }
);

const loadingHashesAtom = atom<string[]>([]);
const loadingAtom = atom((get) => R.isNotEmpty(get(loadingHashesAtom)));
type keyedAlert = [string, 'info' | 'error', ReactElement];
const alertsAtom = atom<keyedAlert[]>([]);
const addAlertAtom = atom(
  null,
  (get, set, type: 'info' | 'error', node: ReactElement) => set(alertsAtom, (errors) => [...errors, [nanoid(6), type, node]])
)
const dismissAlertAtom = atom(null, (get, set, key: string) => set(alertsAtom, rejectFirst(R.eqBy(R.head, [key]))));

type ItemsGeoSpotsByGeohash = { items: GeoSpotsByGeohash }
const fetchSpotsAtom = atom(
  null,
  async (get, set, geohash: string[]) => {
    const loadingHashes = get(loadingHashesAtom);
    const staleHashes = R.difference(geohash, loadingHashes);

    if (R.isEmpty(staleHashes)) {
      return; // already loading, do nothing
    }
    set(loadingHashesAtom, R.union(loadingHashes, staleHashes));

    try {
      const response = await fetch(`/api/spots/${staleHashes.sort()}`);
      const json: ItemsGeoSpotsByGeohash = await response.json();
      if (response.ok) {
        set(mergeSpotsAtom, { ...json.items });
      } else {
        const errorNode = <><code className='font-mono mr-1'>{response.status}</code>無法取得資料</>;
        set(addAlertAtom, 'error', errorNode);
      }
      set(loadingHashesAtom, R.difference(get(loadingHashesAtom), staleHashes));
    } catch (e) {
      const errorNode = <span>{String(e)}</span>;
      set(addAlertAtom, 'error', errorNode);
      set(loadingHashesAtom, R.difference(get(loadingHashesAtom), staleHashes));
    }
  }
);

function MapUser(props: {
  pathname: string
}) {
  const setMap = useSetAtom(mapAtom);
  const geoSet = useAtomValue(geohashesAtom);
  const fetchSpots = useSetAtom(fetchSpotsAtom);
  const [picker, setPicker] = useAtom(areaPickerAtom);
  const setTempMarker = useSetAtom(mergeTempMarkerAtom);
  const status = useAtomValue(statusAtom);
  const prevMode = useRef<string | null>('world');
  const prevStatus = useRef<string | null>(null);
  const addAlert = useSetAtom(addAlertAtom);

  const { pathname } = props;
  const { lat, lon, mode } = parsePath(pathname);

  const debouncedZoomEnd = useDebouncedCallback(() => {
    const zoom = map.getZoom();
    updatePath({ newZoom: zoom });
  }, 800);

  const debouncedMoveEnd = useDebouncedCallback(() => {
    const zoom = map.getZoom();

    if (mode === 'area' && zoom >= AREA_ZOOM_MAX) {
      const bounds = map.getBounds();
      const hashes = geohash.bboxes(
        bounds.getSouth(),
        bounds.getWest(),
        bounds.getNorth(),
        bounds.getEast(),
        GEOHASH_PRECISION
      );

      const newHash = new Set(hashes).difference(geoSet);
      if (newHash.size > 0) {
        fetchSpots(
          R.take(D1_PARAM_LIMIT, Array.from(newHash))
        );
      }
    }

    updatePath({ newCenter: map.getCenter() });
  }, 400);

  const map = useMapEvents({
    click: (e: Leaflet.LeafletMouseEvent) => {
      const anyPopup = Boolean(map.getContainer().querySelector('.leaflet-popup'));
      if (!anyPopup) {
        const point = e.latlng;
        setTempMarker({ visible: true, lat: point.lat, lon: point.lng });
      }
    },
    locationfound: (location) => {
      map.setView(location.latlng, 16);
      map.fire('moveend');
    },
    zoomstart: () => {
      const zoom = map.getZoom();
    },
    zoomend: debouncedZoomEnd,
    moveend: debouncedMoveEnd,
  });

  useEffect(() => {
    setMap(map);
  }, [map, setMap]);

  useEffect(() => {
    if (lat && lon) {
      const zoom = map.getZoom();
      const center = map.getCenter();

      let newZoom = zoom;

      if (prevMode.current === 'world' && mode === 'area' && zoom < AREA_ZOOM_MAX) {
        newZoom = AREA_ZOOM_MAX;
      } else if (prevMode.current === 'area' && mode === 'world' && zoom >= AREA_ZOOM_MAX) {
        newZoom = AREA_ZOOM_MAX - 1;
      }

      if (center.distanceTo([lat, lon]) > 500) {
        map.setView([lat, lon], newZoom);
      } else if (zoom !== newZoom) {
        map.setZoom(newZoom);
      }
    }
  }, [lat, lon, mode, map]);

  useEffect(() => {
    if (prevMode.current === 'area' && mode === 'world') {
      addAlert('info', <><MapIcon className='mr-1 fill-amber-600' height={32} />範圍過大，已暫停讀取地點</>);
    }
    prevMode.current = mode;
  }, [mode, addAlert]);

  useEffect(() => {
    if (prevStatus.current !== 'areaPicker' && status === 'areaPicker') {
      if (picker?.bounds && map) {
        map.fitBounds(picker.bounds);
      }

      const zoom = map.getZoom();
      const content = <div className=''>
        <div className='flex items-center'>
          <StarIcon className='mr-1' height={32} />
          「我的區域」記錄常用的地理範圍，例如住家附近
        </div>
        {zoom < AREA_PICKER_MIN_ZOOM &&
          <div className='my-4'>
            <div className='flex items-center'>
              <MapIcon className='mr-2 fill-amber-600' height={32} />
              現在縮放比例的地理範圍過大。<br />
              點右下角的定位工具開始。
            </div>
          </div>
        }
        <div className='mt-2'>
          決定範圍後，點右上角的「儲存」完成編輯。
        </div>
      </div>;
      addAlert('info', content);
    }
    prevStatus.current = status;
  }, [addAlert, map, picker, status]);

  return null;
}

function AreaPickerControl(params: any) {
  const map = useAtomValue(mapAtom);
  const [picker, setPicker] = useAtom(areaPickerAtom);
  const setUserArea = useSetAtom(setUserAreaAtom);
  const [sending, setSending] = useState(false);
  const addAlert = useSetAtom(addAlertAtom);

  if (!map) {
    return null;
  }

  const onSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const bbox = map.getBounds().toBBoxString();
    const formData = new FormData();
    formData.append('id', picker?.id ? String(picker.id) : '');
    formData.append('bbox', bbox);

    setSending(true);
    const res = await saveUserArea(formData);

    if (res.errors) {
      const errorNode = <>{res.msg}</>;
      addAlert('error', errorNode);
    } else {
      setPicker(null);
      if (res.item) {
        setUserArea({ areaId: res.item.id, bounds: res.item.bounds });
      }
    }
    setSending(false);
  };

  const canSave = !sending && map.getZoom() >= AREA_PICKER_MIN_ZOOM;

  return (
    <div className='flex items-center gap-x-2'>
      <button onClick={onSubmit} className='btn bg-slate-100 ring-1 flex items-center hover:bg-white' disabled={!canSave}>
        <CheckIcon className='stroke-green-700' height={20} />
        {sending ? '處理中……' : '儲存'}
      </button>
      <button className='btn bg-slate-100 ring-1 flex items-center hover:bg-white' onClick={() => setPicker(null)}>
        <XMarkIcon className='stroke-red-700' height={20} />
        取消
      </button>
    </div>
  );
}

function Status(params: any) {
  const status = useAtomValue(statusAtom);
  let msg = '';
  let control = null;

  if (!status) {
    return null;
  }

  switch (status) {
    case 'areaPicker':
      msg = '正在編輯「我的區域」';
      control = <AreaPickerControl />;
      break;
    case 'spotForm':
      msg = '正在編輯新地點';
      control = null;
      break;
    default:
      break;
  }

  return (
    <div className='fixed flex flex-col items-end gap-y-1 top-1 right-2 z-[401]'>
      <div className='p-2 px-4 rounded bg-pink-200 opacity-80'>
        {msg}
      </div>

      {control &&
        <div className=''>
          {control}
        </div>
      }
    </div>
  );
}

function LoadingIndicator(params: any) {
  const loading = useAtomValue(loadingAtom);
  const motionProps = {
    exit: {
      opacity: 0,
      transition: { duration: 1.2 },
    },
  };
  const iconSize = 24;

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        { loading &&
          <div className='fixed z-[900] inset-x-1/2 inset-y-1/2 -translate-x-1/2 -translate-y-1/2'>
            <m.div {...motionProps}>
              <Spinner className='scale-[10]' width={iconSize} height={iconSize} aria-label='讀取中' />
            </m.div>
          </div>
        }
      </AnimatePresence>
    </LazyMotion>
  );
}

type MapProps = {
  children?: React.ReactNode;
  className?: string;
  width?: string | number;
  height?: string | number;
  [key: string]: any;
};

export default function Map({ preloadedAreas, children, className, width, height, ...rest }: MapProps) {
  useHydrateAtoms([
    [spotsAtom, preloadedAreas],
  ]);

  const pathname = usePathname();
  // const searchParams = useSearchParams();

  const areaSpots = useAtomValue(spotsAtom);
  const [areaPicker, setAreaPicker] = useAtom(areaPickerAtom);

  let filteredSpots = R.pipe(
    R.toPairs,
    R.filter(([k, v]) => R.isNotEmpty(v)),
    R.map(R.last),
    R.flatten,
  )(areaSpots) as GeoSpotsResult;

  return (
    <>
      <MapContainer className={`w-full h-[100vh] ${mapStyles.map} ${className || ''}`} {...rest}>
        <MapUser pathname={pathname} />
        <TileLayer
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
          maxZoom={20}
          maxNativeZoom={18}
        >
        </TileLayer>
        {filteredSpots && <SpotMarkers spots={filteredSpots} />}

        <TempMarker />

        <LocateControl className={mapStyles['reset-view-ctrl']} />;
        <ResetViewControl className={mapStyles['reset-view-ctrl']} title='整個台灣' position='bottomright' />
      </MapContainer>

      <Status />
      <Alerts itemsAtom={alertsAtom} dismissAtom={dismissAlertAtom} />
      <LoadingIndicator />
    </>
  );
}
