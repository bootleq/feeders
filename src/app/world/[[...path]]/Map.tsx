"use client"

import * as R from 'ramda';
import geohash from 'ngeohash';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, ReactElement, useCallback } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { useDebouncedCallback } from 'use-debounce';
import { navTitleAtom, alertsAtom, addAlertAtom, dismissAlertAtom } from '@/components/store';
import type { keyedAlert } from '@/components/store';

import type { GeoSpotsResult, GeoSpotsByGeohash } from '@/models/spots';

import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';
import {
  mapAtom,
  spotsAtom,
  mergeSpotsAtom,
  geohashesAtom,
  areaPickerAtom,
  statusAtom,
  mergeTempMarkerAtom,
  loadingFollowupsAtom,
  loadingDistrictAtom,
  toggleHelpAtom,
  advanceDistrictModeAtom,
} from './store';
import { jsonReviver } from '@/lib/utils';
import { parsePath, updatePath, AREA_ZOOM_MAX, GEOHASH_PRECISION } from './util';
import { useHydrateAtoms } from 'jotai/utils';
import Status from './Status';
import MapStatus from './MapStatus';
import { AREA_PICKER_MIN_ZOOM } from './AreaPickerControl';

import Spinner from '@/assets/spinner.svg';
import { MapIcon } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/outline';

import SpotMarkers from './SpotMarkers';
import TempMarker from './TempMarker';
import Help from './Help';
import Districts from './Districts';

import HelpControl from './map-controls/HelpControl';
import DistrictControl from './map-controls/DistrictControl';
import ResetViewControl from './map-controls/ResetViewControl';
import LocateControl from './map-controls/LocateControl';

import mapStyles from './map.module.scss';

import Leaflet from 'leaflet';
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import Alerts from '@/components/Alerts';
import '@/components/leaflet/leaflet.css';

const D1_PARAM_LIMIT = 100;

const loadingHashesAtom = atom<string[]>([]);
const loadedHashesAtom = atom<string[]>([]);
const loadingAtom = atom((get) => R.isNotEmpty(get(loadingHashesAtom)) || get(loadingFollowupsAtom) || get(loadingDistrictAtom));

type ItemsGeoSpotsByGeohash = { items: GeoSpotsByGeohash }
const fetchSpotsAtom = atom(
  null,
  async (get, set, geohash: string[]) => {
    const loadingHashes = get(loadingHashesAtom);
    const loadedHashes = R.union(get(loadedHashesAtom), Object.keys(get(spotsAtom)));

    const staleHashes = R.difference(
      R.difference(geohash, loadedHashes),
      loadingHashes
    );

    if (R.isEmpty(staleHashes)) {
      return; // already loading, do nothing
    }
    set(loadingHashesAtom, R.union(loadingHashes, staleHashes));

    try {
      const response = await fetch(`/api/spots/${staleHashes.sort()}`);
      const json = await response.text();
      const fetched: ItemsGeoSpotsByGeohash = JSON.parse(json, jsonReviver);
      if (response.ok) {
        set(mergeSpotsAtom, { ...fetched.items });
        set(loadedHashesAtom, R.union(get(loadedHashesAtom), staleHashes));
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
  const pathname = usePathname();
  const setNavTitle = useSetAtom(navTitleAtom);

  const { lat, lon, mode } = parsePath(pathname);

  const debouncedZoomEnd = useDebouncedCallback(() => {
    const zoom = map.getZoom();

    if (zoom < AREA_PICKER_MIN_ZOOM) {
      setPicker(null);
    }

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
    setNavTitle(mode === 'area' ? '區域地圖' : '世界地圖');
  }, [mode, setNavTitle]);

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

export default function Map({ preloadedAreas, helpContent, children, className, width, height, ...rest }: MapProps) {
  useHydrateAtoms([
    [spotsAtom, preloadedAreas],
  ]);

  const toggleHelp = useSetAtom(toggleHelpAtom);
  const advanceMode = useSetAtom(advanceDistrictModeAtom);

  const areaSpots = useAtomValue(spotsAtom);
  const [areaPicker, setAreaPicker] = useAtom(areaPickerAtom);

  let filteredSpots = R.pipe(
    R.toPairs,
    R.filter(([k, v]) => R.isNotEmpty(v)),
    R.map(R.last),
    R.flatten,
  )(areaSpots) as GeoSpotsResult[];

  return (
    <>
      <MapContainer className={`w-full h-[100vh] ${mapStyles.map} ${className || ''}`} {...rest}>
        <MapUser />
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
        <DistrictControl className={mapStyles['reset-view-ctrl']} title='行政區界線' position='bottomright' onClick={advanceMode} />
        <HelpControl className={mapStyles['reset-view-ctrl']} title='說明' position='bottomright' onClick={toggleHelp} />
      </MapContainer>

      <Status />
      <MapStatus />
      <Alerts itemsAtom={alertsAtom} dismissAtom={dismissAlertAtom} />
      <Help content={helpContent} />
      <Districts />
      <LoadingIndicator />
    </>
  );
}
