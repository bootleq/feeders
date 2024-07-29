"use client"

import * as R from 'ramda';
import geohash from 'ngeohash';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";

import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';
import { worldCtrlAtom } from '@/app/world/[[..._]]/store';
import type { GetSpotsResponse } from '@/app/api/[[..._]]/endpoints/getSpots';
import Spinner from '@/assets/spinner.svg';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { MapIcon } from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/24/solid';

import Leaflet from 'leaflet';
import type { LatLng } from 'leaflet';
// import * as ReactLeaflet from 'react-leaflet';
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import 'leaflet/dist/leaflet.css';
// import "leaflet-defaulticon-compatibility";
// import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
// import Image from "next/image";

const GEOHASH_PRECISION = 4;
const AREA_ZOOM_MAX = 12;

const spotsAtom = atom({});

const mergeSpotsAtom = atom(
  null,
  (get, set, update: { [key: string]: any[] }) => {
    set(spotsAtom, { ...get(spotsAtom), ...update });
  }
);

const geohashesAtom = atom((get) => {
  return new Set(R.keys(get(spotsAtom)));
});

type MapPropsAtom = {
  zoom?: number
}
const mapPropSnapshotAtom = atom({
  zoom: 18,
}, (get, set, update: MapPropsAtom) => {
  set(mapPropSnapshotAtom, { ...get(mapPropSnapshotAtom), ...update });
});

type StatusAtom = {
  loading?: boolean,
  info?: any,
  error?: any,
}
const statusAtom = atom<StatusAtom>({
  loading: false,
  info: null,
  error: null,
});
const dismissStatusAtom = atom(null, (get, set) => set(statusAtom, { ...get(statusAtom), info: null, error: null }));
const setInfoAtom = atom(null, (get, set, update) => set(statusAtom, { ...get(statusAtom), info: update }));
const fetchSpotsAtom = atom(
  (get) => get(statusAtom),
  async (get, set, geohash: string[]) => {
    const prev = get(statusAtom);
    set(statusAtom, { ...prev, loading: true });

    try {
      const response: GetSpotsResponse = await fetch(`/api/spots/${geohash.sort()}`);
      const json = await response.json();
      if (response.ok) {
        set(statusAtom, { ...prev, loading: false, error: null });
        set(mergeSpotsAtom, { ...json.items });
      } else {
        const errorNode = <><code className='font-mono mr-1'>{response.status}</code>無法取得資料</>;
        set(statusAtom, { ...prev, loading: false, error: errorNode });
      }
    } catch (e) {
      set(statusAtom, { ...prev, loading: false, error: e });
    }
  }
);

type MapProps = {
  children?: React.ReactNode;
  className?: string;
  width?: string | number;
  height?: string | number;
  [key: string]: any;
};

function updatePath(params: {
  newZoom?: number
  newCenter?: LatLng
}) {
  const { newCenter, newZoom } = params;
  const { pathname, search } = window.location;
  let newPath = pathname;

  if (newCenter) {
    const atRegexp = /\/@([\d.]+),([\d.]+)/g;
    newPath = newPath.replaceAll(atRegexp, '');
    newPath = newPath.replace(/\/$/, '') + `/@${newCenter.lat},${newCenter.lng}`;
  }

  if (newZoom) {
    if (newZoom > AREA_ZOOM_MAX) {
      newPath = newPath.replace(/^\/world\/(?!area\/)/, '/world/area/');
    } else {
      newPath = newPath.replace(/^\/world\/area\//, '/world/');
    }
  }

  window.history.replaceState(null, '', newPath + search);
}

function MapUser() {
  const geoSet = useAtomValue(geohashesAtom);
  const fetchSpots = useSetAtom(fetchSpotsAtom);
  const [worldCtrl, setWorldCtrl] = useAtom(worldCtrlAtom);
  const setInfo = useSetAtom(setInfoAtom);
  const prevMode = useRef<string | undefined>('world');

  const { mode } = worldCtrl;

  const map = useMapEvents({
    click: () => {
      // map.locate();
    },
    locationfound: (location) => {
    },
    zoomstart: () => {
      const zoom = map.getZoom();
      const mode = zoom > AREA_ZOOM_MAX ? 'area' : 'world';
      setWorldCtrl({ mode });
      updatePath({ newZoom: zoom });
    },
    zoomend: () => {
      if (prevMode.current === 'area' && mode === 'world') {
        setInfo(<><MapIcon className='mr-1 fill-amber-600' height={32} />範圍過大，已暫停讀取地點</>);
      }
      prevMode.current = mode;
    },
    moveend: () => {
      const bounds = map.getBounds();
      const hashes = geohash.bboxes(
        bounds.getSouth(),
        bounds.getWest(),
        bounds.getNorth(),
        bounds.getEast(),
        GEOHASH_PRECISION
      );

      if (mode === 'area') {
        const newHash = new Set(hashes).difference(geoSet);
        if (newHash.size > 0) {
          fetchSpots(Array.from(newHash));
        }
      }

      updatePath({ newCenter: map.getCenter() });
    },
  });

  return null;
}

function Notification(params: any) {
  const dismiss = useSetAtom(dismissStatusAtom);
  const { loading, info, error } = useAtomValue(statusAtom);
  const cls = [
    'flex items-center',
    'w-max h-max px-6 py-4 shadow-[10px_20px_20px_14px_rgba(0,0,0,0.5)]',
    'text-lg bg-pink-300/20 backdrop-blur-sm ring ring-3 ring-offset-1 ring-slate-500 rounded',
  ].join(' ');

  const motionProps = {
    initial: { y: '-200%' },
    animate: { y: 0 },
    exit: {
      opacity: 0,
      transition: { duration: 1.2 },
    },
  };

  const open = loading || error || info;

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        { open &&
          <div className='fixed z-[900] inset-x-1/2 inset-y-1/2 -translate-x-1/2 -translate-y-full w-max h-max'>
            {loading &&
              <m.div className={`${cls}`} {...motionProps}>
                <Spinner className='animate-spin mr-1 min-w-max' height={24} />
                讀取中
              </m.div>
            }
            {info &&
              <div className={`${cls} bg-white/50 ring-yellow my-3 py-9 px-9`}>
                <MapIcon className='mr-1 fill-amber-600' height={32} />
                範圍變大，已暫停讀取地點
                <XMarkIcon className='absolute right-1 top-1 ml-auto cursor-pointer fill-slate-500' onClick={() => dismiss()} height={24} />
              </div>
            }
            {error &&
              <div className={`${cls} bg-red ring-black my-3 py-9 px-9`}>
                <ExclamationCircleIcon className='mr-1 fill-white stroke-red-700 stroke-2' height={32} />
                錯誤：{error}
                <XMarkIcon className='absolute right-1 top-1 ml-auto cursor-pointer fill-slate-500' onClick={() => dismiss()} height={24} />
              </div>
            }
          </div>
        }
      </AnimatePresence>
    </LazyMotion>
  );
}

export default function Map({ children, className, width, height, ...rest }: MapProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // useEffect(() => {
  //   (async function init() {
  //     delete Leaflet.Icon.Default.prototype._getIconUrl;
  //     Leaflet.Icon.Default.mergeOptions({
  //       iconRetinaUrl: 'leaflet/images/marker-icon-2x.png',
  //       iconUrl: 'leaflet/images/marker-icon.png',
  //       shadowUrl: 'leaflet/images/marker-shadow.png',
  //     });
  //   })();
  // }, []);

  return (
    <>
      <MapContainer className={`w-full h-[100vh] ${className || ''}`} {...rest}>
        <MapUser />
        <TileLayer
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
          maxZoom={20}
          maxNativeZoom={18}
        >
        </TileLayer>
      </MapContainer>

      <Notification />
    </>
  );
}
