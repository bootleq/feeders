"use client"

import * as R from 'ramda';
import Leaflet, { MarkerCluster } from 'leaflet';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useThrottledCallback } from 'use-debounce';
import { useAtom } from 'jotai';
import { MapContainer, TileLayer, useMapEvents, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';
import { PlusIcon } from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { CheckIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

import FoodLife from './FoodLife';
import ActionLabel from './ActionLabel';
import FollowupForm from './FollowupForm';
import { editingFormAtom } from './store';
import { present } from '@/lib/utils';
import { format, formatDistance } from '@/lib/date-fp';
import type { GeoSpotsResult } from '@/models/spots';
import mapStyles from '@/components/map.module.scss';

const googleMapURL = (lat: number, lon: number) => {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}

const tooltipCls = [
  'text-xs p-1 px-2 rounded box-border w-max max-w-[100vw-10px] z-[1002]',
  'bg-gradient-to-br from-stone-50 to-slate-100 ring-2 ring-offset-1 ring-slate-300',
].join(' ')

function clusterIconFn(cluster: MarkerCluster) {
  const childCount = Number(cluster.getChildCount());
  const size = childCount < 10 ? 'small' : childCount < 50 ? 'medium' : 'large';

  return new Leaflet.DivIcon({
    html: `<div class='font-mono'><span>` + childCount + ' <span aria-label="markers"></span>' + '</span></div>',
    className: `marker-cluster marker-cluster-${size} ${mapStyles['cluster-marker']}`,
    iconSize: new Leaflet.Point(40, 40),
  });
};

const MarkerIcon = new Leaflet.DivIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6 -translate-x-3 -translate-y-3">
    <path fill-rule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clip-rule="evenodd" /></svg>`,
  className: 'leaflet-div-marker',
  popupAnchor: [-6, -18],
})

export default function SpotMarkers({ spots }: {
  spots: GeoSpotsResult
}) {
  const [editingForm, setEditingForm] = useAtom(editingFormAtom);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setNow(new Date());
  }, []);

  const throttledSetNow = useThrottledCallback(() => {
    setNow(new Date());
  }, 3000, { trailing: false });

  const eventHandlers = useMemo(
    () => ({
      popupopen: throttledSetNow,
    }),
    [throttledSetNow],
  );

  const startEdit = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingForm('followup');
  }, [setEditingForm]);

  const cancel = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingForm('');
  }, [setEditingForm]);

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
            <Marker key={s.id} position={[s.lat, s.lon]} icon={MarkerIcon} autoPan={false} eventHandlers={eventHandlers}>
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
                    座標
                    <Tooltip>
                      <TooltipTrigger><code className='text-xs ml-2 max-w-20 truncate hover:bg-yellow-300/50'>{s.lat}</code></TooltipTrigger>
                      <TooltipContent className={`${tooltipCls}`}>{s.lat}</TooltipContent>
                    </Tooltip>
                    <small className='text-xs'>,</small>
                    <Tooltip>
                      <TooltipTrigger><code className='text-xs ml-1 max-w-20 truncate hover:bg-yellow-300/50'>{s.lon}</code></TooltipTrigger>
                      <TooltipContent className={`${tooltipCls}`}>{s.lon}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger>
                        <a
                          className='flex items-start font-sans whitespace-nowrap rounded-full hover:bg-yellow-300/50'
                          aria-label='在 Google 地圖開啟座標'
                          href={googleMapURL(s.lat, s.lon)}
                          target='_blank'
                        >
                          <span className='text-sm text-slate-700 px-1 font-bold'>G</span>
                        </a>
                      </TooltipTrigger>
                      <TooltipContent className={`${tooltipCls}`}>在 Google 地圖開啟座標</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {present(s.desc) &&
                  <div className='h-max-60 px-1 py-1 mx-0.5 my-1 resize-y bg-gradient-to-br from-stone-50 to-slate-100 ring-1 rounded'>
                    {s.desc}
                  </div>
                }

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
                    <ActionLabel action={s.action} className='ml-auto flex items-center' />
                  </div>

                  {present(s.followupDesc) &&
                    <div className='p-1 mb-1 mx-1 bg-gradient-to-br from-stone-50 to-slate-100 ring-1 rounded'>{s.followupDesc}</div>
                  }
                </div>

                {editingForm === 'followup' &&
                  <>
                    <hr className='w-11/12 h-px mx-auto my-5 bg-green-800 border-0 dark:bg-gray-700' />
                    <span className='block mx-auto -mt-[1.9rem] mb-2 px-3 w-min whitespace-nowrap bg-white text-sm text-center text-green-800 font-bold'>
                      新增動態
                    </span>
                    <FollowupForm spotId={s.id} geohash={s.geohash} />
                  </>
                }

                {editingForm !== 'followup' &&
                  <div className='w-full flex items-center mt-2'>
                    <button className='flex items-center justify-center py-1' onClick={startEdit}>
                      ➕ 跟進
                    </button>

                    {s.followCount > 1 &&
                      <div className='ml-auto text-center'>載入其他 {s.followCount - 1} 則動態</div>
                    }
                  </div>
                }

              </Popup>
            </Marker>
          );
        })
      }
    </MarkerClusterGroup>
  );
};
