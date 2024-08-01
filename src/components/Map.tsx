"use client"

import * as R from 'ramda';
import geohash from 'ngeohash';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import mapStyles from './map.module.scss'
import { format, formatDistance } from '@/lib/date-fp';

import type { GeoSpotsResult, GeoSpotsByGeohash } from '@/models/spots';

import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';
import { spotsAtom, mergeSpotsAtom, geohashesAtom } from '@/app/world/[[..._]]/store';
import { useHydrateAtoms } from 'jotai/utils';

import Spinner from '@/assets/spinner.svg';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { MapIcon } from '@heroicons/react/24/solid';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { UserCircleIcon } from '@heroicons/react/24/solid';

import ActionLabel from '@/app/world/[[..._]]/ActionLabel';
import FoodLife from '@/app/world/[[..._]]/FoodLife';

import Leaflet, { MarkerCluster } from 'leaflet';
import { LatLng } from 'leaflet';
import { MapContainer, TileLayer, useMapEvents, Marker, Popup } from "react-leaflet";
import ResetViewControl from './ResetViewControl';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';

const GEOHASH_PRECISION = 4;
const AREA_ZOOM_MAX = 12;
const D1_PARAM_LIMIT = 100;

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

type ItemsGeoSpotsByGeohash = { items: GeoSpotsByGeohash }
const fetchSpotsAtom = atom(
  (get) => get(statusAtom),
  async (get, set, geohash: string[]) => {
    const prev = get(statusAtom);
    set(statusAtom, { ...prev, loading: true });

    try {
      const response = await fetch(`/api/spots/${geohash.sort()}`);
      const json: ItemsGeoSpotsByGeohash = await response.json();
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

const atRegexp = /\/@([\d.]+),([\d.]+)/g;

function parsePath(pathname: string) {
  const result: {
    lat: number | null,
    lon: number | null,
    mode: string | null,
  } = { lat: null, lon: null, mode: null };

  let s = pathname.slice('/world'.length);

  if (s.match(/^\/area/)) {
    s = s.replace(/^\/area/, '');
    result.mode = 'area';
  } else {
    result.mode = 'world';
  }
  const at = [...s.matchAll(atRegexp)];
  if (at[0]) {
    result.lat = Number(at[0][1]);
    result.lon = Number(at[0][2]);
  }

  return result;
}

function updatePath(params: {
  newZoom?: number
  newCenter?: LatLng
}) {
  const { newCenter, newZoom } = params;
  const { pathname, search } = window.location;
  let newPath = pathname;

  if (newCenter) {
    newPath = newPath.replaceAll(atRegexp, '');
    newPath = newPath.replace(/\/$/, '') + `/@${newCenter.lat},${newCenter.lng}`;
  }

  if (newZoom) {
    if (newZoom >= AREA_ZOOM_MAX) {
      newPath = newPath.replace(/^\/world\/(?!area\/)/, '/world/area/');
    } else {
      newPath = newPath.replace(/^\/world\/area\//, '/world/');
    }
  }

  window.history.replaceState(null, '', newPath + search);
}

function MapUser(props: {
  pathname: string
}) {
  const geoSet = useAtomValue(geohashesAtom);
  const fetchSpots = useSetAtom(fetchSpotsAtom);
  const setInfo = useSetAtom(setInfoAtom);
  const prevMode = useRef<string | null>('world');

  const { pathname } = props;
  const { lat, lon, mode } = parsePath(pathname);

  const map = useMapEvents({
    click: () => {
      // map.locate();
    },
    locationfound: (location) => {
    },
    zoomstart: () => {
      const zoom = map.getZoom();
    },
    zoomend: () => {
      const zoom = map.getZoom();

      if (prevMode.current === 'area' && mode === 'world') {
        setInfo(<><MapIcon className='mr-1 fill-amber-600' height={32} />範圍過大，已暫停讀取地點</>);
      // } else if (prevMode.current === 'world' && mode === 'area') {
      //   setInfo(<><MapIcon className='mr-1 fill-amber-600' height={32} />已開始讀取地點</>);
      }
      updatePath({ newZoom: zoom });
      prevMode.current = mode;
    },
    moveend: () => {
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
    },
  });

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
                {info}
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

const googleMapURL = (lat: number, lon: number) => {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}

const MarkerIcon = new Leaflet.DivIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6 -translate-x-3 -translate-y-3">
    <path fill-rule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clip-rule="evenodd" /></svg>`,
  className: 'leaflet-div-marker',
  popupAnchor: [-6, -18],
})

function clusterIconFn(cluster: MarkerCluster) {
  const childCount = Number(cluster.getChildCount());
  const size = childCount < 10 ? 'small' : childCount < 50 ? 'medium' : 'large';

  return new Leaflet.DivIcon({
    html: `<div class='font-mono'><span>` + childCount + ' <span aria-label="markers"></span>' + '</span></div>',
    className: `marker-cluster marker-cluster-${size} ${mapStyles['cluster-marker']}`,
    iconSize: new Leaflet.Point(40, 40),
  });
};

function Markers({ spots }: {
  spots: GeoSpotsResult
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setNow(new Date());
  }, []);

  const statLiCls = 'hover:bg-yellow-300/50 pr-1';
  const statNumCls = 'font-mono px-1 align-baseline';

  return (
    <MarkerClusterGroup chunkedLoading removeOutsideVisibleBounds={false} iconCreateFunction={clusterIconFn}>
      {
        spots.map(s => {
          const foodable = {
            ...s,
            spawnedAt: s.latestSpawnAt,
            removedAt: s.latestRemovedAt,
          };

          const latestFollowAge = formatDistance(now, s.latestFollowAt).replace('大約', '').trim();

          return (
            <Marker key={s.id} position={[s.lat, s.lon]} icon={MarkerIcon}>
              <Popup className={mapStyles.popup} autoPan={false}>
                <div className='p-1'>
                  <strong className='block mb-1'>{s.title}</strong>

                  <FoodLife spot={foodable} now={now} />

                  <ul className='flex flex-wrap items-center gap-x-1.5 my-1 text-sm'>
                    <li className={statLiCls}>跟進人 <var className={statNumCls}>{s.followerCount}</var></li>
                    <li className={statLiCls}>重生 <var className={statNumCls}>{s.respawnCount}</var></li>
                    <li className={statLiCls}>隻數 <var className={statNumCls}>{s.maxFeedee}</var></li>
                    <li className={statLiCls}>餵食素質 <var className={`${statNumCls} font-sans`}>未知</var></li>
                  </ul>

                  <div className='flex items-center text-sm'>
                    座標 <code className='text-xs mx-2'>{s.lat},{s.lon}</code>
                    <a
                      className='flex items-center font-sans whitespace-nowrap hover:bg-yellow-300/50'
                      aria-label='在 Google 地圖開啟座標'
                      href={googleMapURL(s.lat, s.lon)}
                      target='_blank'
                    >
                      <span className='text-xs text-slate-700 font-bold'>G</span>
                      <ArrowTopRightOnSquareIcon className='fill-slate-700 h-3' height={24} />
                    </a>
                  </div>
                </div>

                <div className='h-max-60 px-1 py-1 mx-0.5 my-1 resize-y bg-gradient-to-br from-stone-50 to-slate-100 ring-1 rounded'>
                  {s.desc}
                </div>

                <div className='mt-2 px-2 text-right text-xs text-slate-500/75'>
                  建立：<span className='font-mono'>{format({}, 'y/M/d', s.createdAt)}</span> by {s.userId}
                </div>

                <hr className='w-11/12 h-px mx-auto my-5 bg-gray-200 border-0 dark:bg-gray-700' />
                <span className='block mx-auto -mt-[1.9rem] mb-2 px-3 w-min whitespace-nowrap bg-white text-sm text-center text-slate-500'>
                  最新動態
                </span>

                <div className='flex flex-wrap justify-start items-center'>
                  <div className='px-1 mb-0.5 flex flex-wrap justify-start text-sm items-center'>
                    <span data-user-id={s.followerId} className='mr-3 flex items-center'>
                      <UserCircleIcon className='fill-current' height={24} />
                      USER NAME
                    </span>
                    <span className='text-sm mr-2 whitespace-nowrap font-mono'>
                      {latestFollowAge}
                    </span>
                    <ActionLabel action={s.action} className='ml-auto' />
                  </div>

                  <div className='p-1 mb-1 mx-1 bg-gradient-to-br from-stone-50 to-slate-100 ring-1 rounded'>{s.followupDesc}</div>
                </div>

                {s.followCount > 1 &&
                  <div className='w-full text-center'>載入其他 {s.followCount - 1} 則動態</div>
                }
              </Popup>
            </Marker>
          );
        })
      }
    </MarkerClusterGroup>
  );
};

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
        {filteredSpots && <Markers spots={filteredSpots} />}
        <ResetViewControl className={mapStyles['reset-view-ctrl']} title='整個台灣' position='bottomright' />
      </MapContainer>

      <Notification />
    </>
  );
}
