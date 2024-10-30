"use client"

import * as R from 'ramda';
import Leaflet, { MarkerCluster } from 'leaflet';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useThrottledCallback } from 'use-debounce';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { MapContainer, TileLayer, useMapEvents, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';
import { Desc } from '@/components/Desc';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { CheckIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { Square3Stack3DIcon } from '@heroicons/react/24/outline';

import { useSession } from 'next-auth/react';
import FoodLife from './FoodLife';
import ActionLabel from './ActionLabel';
import FollowupForm from './FollowupForm';
import AmendSpotForm from './AmendSpotForm';
import AmendFollowupForm from './AmendFollowupForm';
import { editingFormAtom, spotFollowupsAtom, mergeSpotFollowupsAtom, loadingFollowupsAtom } from './store';
import { addAlertAtom } from '@/components/store';
import { present, jsonReviver, ACCESS_CTRL } from '@/lib/utils';
import { format, formatDistance } from '@/lib/date-fp';
import type { GeoSpotsResult, GeoSpotsResultFollowup } from '@/models/spots';
import mapStyles from '@/components/map.module.scss';

const googleMapURL = (lat: number, lon: number) => {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}

const tooltipCls = [
  'text-xs p-1 px-2 rounded box-border w-max max-w-[calc(100vw_-_10px)] z-[1002]',
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

const mapIconSize = 36;

const MarkerIcon = new Leaflet.DivIcon({
  html: `<svg width="${mapIconSize}px" height="${mapIconSize}px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26" fill="currentColor" class="-translate-x-3 -translate-y-5">
    <path fill-rule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clip-rule="evenodd" /></svg>`,
  className: 'leaflet-div-marker',
  popupAnchor: [-1, -23],
})

const ResolvedMarkerIcon = new Leaflet.DivIcon({
  html: `<svg width="${mapIconSize}px" height="${mapIconSize}px" viewBox="0 0 24 24" fill="none" class="-translate-x-3 -translate-y-6" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M15.5304 7.46967C15.8232 7.76256 15.8232 8.23744 15.5304 8.53033L12.0304 12.0303C11.7375 12.3232 11.2626 12.3232 10.9697 12.0303L8.9697 10.0303C8.6768 9.73744 8.6768 9.26256 8.9697 8.96967C9.26259 8.67678 9.73746 8.67678 10.0304 8.96967L11.5 10.4393L14.4697 7.46967C14.7626 7.17678 15.2375 7.17678 15.5304 7.46967Z" fill="#000000"/><path fill-rule="evenodd" clip-rule="evenodd" d="M3.52439 8.85685C3.87872 4.55824 7.47087 1.25 11.7841 1.25H12.216C16.5292 1.25 20.1213 4.55824 20.4757 8.85685C20.666 11.166 19.9527 13.4589 18.4861 15.2526L13.693 21.1144C12.818 22.1845 11.1821 22.1845 10.307 21.1144L5.51399 15.2526C4.04733 13.4589 3.33405 11.166 3.52439 8.85685ZM11.7841 2.75C8.25152 2.75 5.30952 5.45948 5.01932 8.98008C4.8609 10.9019 5.45455 12.8102 6.67521 14.3031L11.4683 20.1649C11.7431 20.501 12.2569 20.501 12.5318 20.1649L17.3248 14.3031C18.5455 12.8102 19.1391 10.9019 18.9807 8.98008C18.6905 5.45948 15.7485 2.75 12.216 2.75H11.7841Z" fill="#000000"/></svg>`,
  className: 'leaflet-div-marker',
  popupAnchor: [0, -28],
})

type ItemsFollowups = { items: GeoSpotsResultFollowup[] }
const fetchFollowupsAtom = atom(
  null,
  async (get, set, spotId: number) => {
    try {
      set(loadingFollowupsAtom, true);
      const response = await fetch(`/api/followups/${spotId}`);
      const json = await response.text();
      const fetched: ItemsFollowups = JSON.parse(json, jsonReviver);
      if (response.ok) {
        set(mergeSpotFollowupsAtom, [spotId, fetched.items]);
      } else {
        const errorNode = <><code className='font-mono mr-1'>{response.status}</code>載入跟進資料失敗</>;
        set(addAlertAtom, 'error', errorNode);
      }
      set(loadingFollowupsAtom, false);
    } catch (e) {
      const errorNode = <span>{String(e)}</span>;
      set(addAlertAtom, 'error', errorNode);
      set(loadingFollowupsAtom, false);
    }
  }
);

export default function SpotMarkers({ spots }: {
  spots: GeoSpotsResult[]
}) {
  const { data: session, status } = useSession();
  const [editingForm, setEditingForm] = useAtom(editingFormAtom);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [now, setNow] = useState(() => new Date());
  const fetchFollowups = useSetAtom(fetchFollowupsAtom);
  const postloadFollowups = useAtomValue(spotFollowupsAtom);
  const loading = useAtomValue(loadingFollowupsAtom);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const throttledSetNow = useThrottledCallback(() => {
    setNow(new Date());
  }, 3000, { trailing: false });

  const loadFollowups = useCallback((spotId: number) => {
    fetchFollowups(spotId);
  }, [fetchFollowups]);

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

  const startAmendSpot = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingForm('amendSpot');
  }, [setEditingForm]);

  const startAmendFollowup = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const id = e.currentTarget.dataset.followupId;
    setEditingForm('amendFollowup');
    setEditingItemId(Number(id));
  }, [setEditingForm]);

  const cancel = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingForm('');
    setEditingItemId(null);
  }, [setEditingForm]);

  const statLiCls = 'hover:bg-yellow-300/50 pr-1';
  const statNumCls = 'font-mono px-1 align-baseline';

  const canEdit = ACCESS_CTRL === 'open' && status === 'authenticated' && session.user.state === 'active';
  const userId = session?.user.id;

  return (
    <MarkerClusterGroup chunkedLoading removeOutsideVisibleBounds={false} iconCreateFunction={clusterIconFn} disableClusteringAtZoom={18}>
      {
        spots.map(({ spot: s, followups: foFromProps }) => {
          const followups = postloadFollowups[s.id] || foFromProps;
          const latestFollowup = R.reduce<GeoSpotsResultFollowup, GeoSpotsResultFollowup>(R.maxBy(R.prop('createdAt')), followups[0], followups);
          const foodable = {
            spotState: latestFollowup.spotState,
            material: s.latestMaterial,
            spawnedAt: s.latestSpawnAt,
            removedAt: s.latestRemovedAt,
          };
          const icon = latestFollowup.action === 'resolve' ? ResolvedMarkerIcon : MarkerIcon;

          return (
            <Marker key={s.id} position={[s.lat, s.lon]} icon={icon} autoPan={false} eventHandlers={eventHandlers}>
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
                  <Desc value={s.desc} className='max-h-60 overflow-auto md:max-w-xl px-1 py-1 mx-0.5 my-1 resize-y bg-gradient-to-br from-stone-50 to-slate-100 ring-1 rounded' />
                }

                {editingForm === 'amendSpot' &&
                  <AmendSpotForm spot={s} />
                }

                <div className='flex items-center justify-end mt-2 px-2 text-xs text-slate-500/75'>
                  建立：<span className='font-mono mr-1'>{format({}, 'y/M/d', s.createdAt)}</span> by
                  <Link href={`/user/${s.userId}`} data-user-id={s.userId} className='ml-1 hover:bg-yellow-300/50 hover:text-slate-950'>
                    {s.userName}
                  </Link>

                  {canEdit && userId === s.userId &&
                    <Tooltip>
                      <TooltipTrigger>
                        <button className='inline-flex items-center justify-center p-1 hover:bg-yellow-300/50 rounded-full' onClick={startAmendSpot}>
                          <PencilSquareIcon className='stroke-current' height={18} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className={`${tooltipCls}`}>修改（會留下記錄）</TooltipContent>
                    </Tooltip>
                  }

                  {s.changes > 0 ?
                    <Tooltip>
                      <TooltipTrigger>
                        <Link href={`/audit/spot/${s.id}`} className='inline-flex items-center justify-center p-1 hover:bg-purple-700/50 hover:text-white rounded-full' target='_blank'>
                          <Square3Stack3DIcon className='stroke-current' height={18} />
                          {s.changes}
                        </Link>
                        <TooltipContent className={`${tooltipCls}`}>調閱編修記錄（在新分頁開啟）</TooltipContent>
                      </TooltipTrigger>
                    </Tooltip>
                    : ''
                  }
                </div>

                <hr className='w-11/12 h-px mx-auto my-5 bg-gray-200 border-0 dark:bg-gray-700' />
                <span className='block mx-auto -mt-[1.9rem] mb-2 px-3 w-min whitespace-nowrap bg-white text-sm text-center text-slate-500'>
                  最新動態
                </span>

                <div className='max-h-[65vh] overflow-auto scrollbar-thin'>
                  {followups.map(fo => (
                    <div key={fo.id} className='flex flex-col justify-start items-start mb-2'>
                      <div className='px-1 mb-1 flex flex-wrap justify-start text-sm items-center'>
                        <Link href={`/user/${fo.userId}`} data-user-id={fo.userId} className='mr-3 flex items-center hover:bg-yellow-300/50 text-inherit'>
                          <UserCircleIcon className='fill-current' height={18} />
                          { fo.userName }
                        </Link>
                        <Tooltip>
                          <TooltipTrigger className='text-sm mr-2 whitespace-nowrap font-mono'>
                            {formatDistance(now, fo.createdAt).replace('大約', '').trim()}
                          </TooltipTrigger>
                          <TooltipContent className={`${tooltipCls} font-mono`}>{format({}, 'y/M/d HH:mm', fo.createdAt)}</TooltipContent>
                        </Tooltip>
                        <ActionLabel action={fo.action} className='ml-auto flex items-center' />

                        {canEdit && userId === fo.userId &&
                          <Tooltip>
                            <TooltipTrigger>
                              <button className='inline-flex items-center justify-center p-1 ml-1 text-slate-500/75 hover:bg-yellow-300/50 rounded-full' data-followup-id={fo.id} onClick={startAmendFollowup}>
                                <PencilSquareIcon className='stroke-current' height={18} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className={`${tooltipCls}`}>修改（會留下記錄）</TooltipContent>
                          </Tooltip>
                        }
                        {fo.changes > 0 ?
                          <Tooltip>
                            <TooltipTrigger>
                              <Link href={`/audit/followup/${fo.id}`} className='inline-flex items-center justify-center p-1 ml-1 text-slate-500/75 hover:bg-purple-700/50 hover:text-white rounded-full' target='_blank'>
                                <Square3Stack3DIcon className='stroke-current' height={18} />
                                {fo.changes}
                              </Link>
                              <TooltipContent className={`${tooltipCls}`}>調閱編修記錄（在新分頁開啟）</TooltipContent>
                            </TooltipTrigger>
                          </Tooltip>
                          : ''
                        }
                      </div>

                      {present(fo.desc) &&
                        <Desc value={fo.desc} className='max-h-32 overflow-auto md:max-w-xl p-1 mb-1 mx-1 resize-y bg-gradient-to-br from-stone-50 to-slate-100 ring-1 rounded' />
                      }

                      {editingForm === 'amendFollowup' && editingItemId === fo.id &&
                        <AmendFollowupForm followup={fo} geohash={s.geohash} />
                      }
                    </div>
                  ))}
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

                {canEdit && editingForm !== 'followup' &&
                  <div className='w-full flex items-center mt-2'>
                    <button className='flex items-center justify-center py-1' onClick={startEdit}>
                      ➕ 跟進
                    </button>

                    {s.followCount > followups.length &&
                      <button className='ml-auto text-center' onClick={() => loadFollowups(s.id)} disabled={loading}>
                        {loading ? '讀取中……' :
                          `載入其他 ${s.followCount - followups.length} 則動態`
                        }
                      </button>
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
