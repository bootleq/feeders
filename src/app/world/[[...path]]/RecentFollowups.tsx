"use client"

import * as R from 'ramda';
import { useState, useEffect, useRef, useCallback } from 'react';
import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';
import { subDays, format, formatISO, formatDistanceToNow, formatDistance } from '@/lib/date-fp';
import Link from 'next/link';

import { recentFollowups } from '@/models/spots';
import { userAtom, mapAtom, areaPickerAtom } from './store';
import type { AreaPickerAtom } from './store';
import type { GeoSpotsResult, GeoSpotsByGeohash } from '@/models/spots';
import type { LatLngBounds } from '@/lib/schema';
import ActionLabel from './ActionLabel';
import FoodLife from './FoodLife';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';
import { StarIcon } from '@heroicons/react/24/outline';
import { MapPinIcon } from '@heroicons/react/24/solid';
import { UserCircleIcon } from '@heroicons/react/24/solid';

type RecentFollowupsItemProps = Awaited<ReturnType<typeof recentFollowups>>[number];

const viewItemAtom = atom<RecentFollowupsItemProps | null>(null);
const setDefaultViewItemAtom = atom(
  null,
  (get, set, update: RecentFollowupsItemProps) => set(viewItemAtom, (value) => (R.isNil(value) ? update : value))
)

function SpotInfo() {
  const spot = useAtomValue(viewItemAtom);
  const [autoExpand, setAutoExpand] = useState(false);
  const [isOverflow, setIsOverflow] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const viewBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = viewBoxRef.current;
    if (container && container.scrollHeight > container.clientHeight) {
      setIsOverflow(true);
    } else {
      setIsOverflow(false);
    }
  }, [spot]);

  useEffect(() => {
    setNow(new Date());
  }, [spot]);

  const descClass = [
    'leading-6 min-h-[calc(1.5rem*7)] mt-1 pt-1 pb-[calc(1.5rem*1.2)]',
    'scrollbar-thin scrollbar-track-slate-300 scrollbar-thumb-slate-700',
    `resize-y ${autoExpand ? 'overflow-auto' : 'overflow-auto h-[calc(1.5rem*7)]'}`,
    `bg-gradient-to-br from-stone-50 to-slate-100`,
  ].join(' ');

  if (R.isEmpty(spot) || R.isNil(spot)) {
    return (
      <div className='relative px-2 py-1'>
        <strong className='mb-1 block'><span className='invisible'>未選擇</span></strong>
        <span className='mr-3 flex'>
          <UserCircleIcon className='invisible' height={24} />
        </span>
        <div className={descClass}></div>
      </div>
    );
  }

  return (
    <div className='relative px-2 py-1'>
      <Tooltip placement='bottom-end'>
        <TooltipTrigger className='mb-1 block truncate'>
          {spot.spotTitle}
        </TooltipTrigger>
        <TooltipContent className="p-1 text-xs rounded box-border w-max z-[1002] bg-slate-100 ring-1">
          {spot.spotTitle}
        </TooltipContent>
      </Tooltip>

      <div className='flex flex-wrap justify-start items-center'>
        <span data-user-id={spot.userId} className='mr-3 text-sm flex items-center'>
          <UserCircleIcon className='fill-current' height={24} />
          USER NAME
        </span>
        {
          R.any(R.isNotNil)(R.props(['city', 'town'], spot)) ?
            <Link
              href={`/world/area/@${spot.lat},${spot.lon}`}
              onClick={visitArea(spot.lat, spot.lon)}
              className='break-keep whitespace-nowrap w-min cursor-pointer text-sm opacity-60 mr-3'
              prefetch={false}
            >
              {spot.city}{spot.town}
            </Link>
            : ''
        }

        <time className='text-sm font-mono whitespace-nowrap mr-2' dateTime={`${spot.createdAt}`}>
          {formatDistanceToNow(spot.createdAt).replace('大約', '')}
        </time>

        <ActionLabel action={spot.action} />
      </div>

      <FoodLife spot={spot} now={now} />

      <div className={descClass} ref={viewBoxRef} data-name='spot-view-item'>
        {spot.desc}
        {spot.desc}
        {spot.desc}
        {spot.desc}
        {spot.desc}
        {spot.desc}
        {spot.desc}
        {spot.desc}
      </div>
    </div>
  );
}

function visitArea(lat: number, lon: number) {
  return (e: React.SyntheticEvent) => {
    window.history.pushState(null, '', `/world/area/@${lat},${lon}`);
  }
}

const areaItemCls = 'relative rounded p-1 mx-1 flex items-center cursor-pointer grow-0 text-center bg-slate-200';
const menuItemCls = `p-2 w-full`;

function UserArea({ area }: {
  area: AreaPickerAtom
}) {
  const map = useAtomValue(mapAtom);
  const setPicker = useSetAtom(areaPickerAtom);

  const fitArea = useCallback(() => {
    if (map && area?.bounds) {
      map.fitBounds(area.bounds);
    }
  }, [area, map]);

  const onEdit = useCallback(() => {
    if (area?.id) {
      setPicker(area);
    } else {
      const newArea = {
        id: null,
        bounds: null,
      };
      setPicker(newArea);
    }
  }, [area, setPicker]);

  const canFit = R.isNotNil(area?.bounds);

  return (
    <li className={`${areaItemCls} flex-col whitespace-nowrap`} onClick={canFit ? fitArea : onEdit}>
      <Tooltip placement='bottom-end'>
        <TooltipTrigger className='flex flex-col items-center'>
          <StarIcon className={`${canFit ? '' : 'dotted-stroke stroke-slate-500'}`} height={24} />
          我的
        </TooltipTrigger>
        <TooltipContent className="p-1 px-2 rounded box-border w-max max-w-[100vw-10px] z-[1002]">
          <div className={`flex flex-col divide-y w-full items-center justify-between lg:flex rounded bg-gradient-to-br from-stone-50 to-slate-100 ring-2 ring-offset-1 ring-slate-300`}>
            <button className={menuItemCls} onClick={onEdit}>{canFit ? '編輯' : '新增'}</button>
          </div>
        </TooltipContent>
      </Tooltip>
    </li>
  );
}

function Areas({ areas }: {
  areas: GeoSpotsByGeohash
}) {
  const user = useAtomValue(userAtom);
  const userArea = (user?.areaId && user.bounds) ? { id: user.areaId, bounds: user.bounds } : null;

  const picked: [string, GeoSpotsResult[number], number][] = R.toPairs(areas).map(([geohash, items]) => {
    const spot = R.sortBy(R.prop('latestFollowAt'), items)[0];
    return [geohash, spot, items.length];
  });

  return (
    <div className='mt-4 mb-2 p-1 overflow-visible'>
      前往區域
      <ul className='flex py-1 overflow-hidden scrollbar-thin'>
        <UserArea area={userArea} />

        {picked.map(([geohash, { lat, lon, city, town }, _spotsCount]) => {
          return (
            <li key={geohash} className={areaItemCls}>
              <Link
                href={`/world/area/@${lat},${lon}`}
                onClick={visitArea(lat, lon)}
                className='break-keep w-min cursor-pointer'
                prefetch={false}
              >
                {city} {town}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function recentDateStrings(today: Date, oldestDate: Date) {
  const days = R.range(0, 5); // FIXME: 5 is magic
  return days
    .map(d => subDays(d, today))
    .map(formatISO({ representation: 'date' }));
}

function mapPinCls(spotState: string) {
  switch (spotState) {
    case 'dirty':
      return 'fill-amber-950';
    case 'clean':
      return 'fill-slate-400 opacity-70';
      break;
    case 'tolerated':
      return 'fill-blue-700';
      break;
    default:
      return 'fill-current';
  }
}

function Followups({ items, today, oldestDate }: {
  items: RecentFollowupsItemProps[],
  today: Date,
  oldestDate: Date
}) {
  const [viewItem, setViewItem] = useAtom(viewItemAtom);

  if (!items?.length) {
    return <p className='p-1'>沒有新發現。</p>;
  }

  const indexByDate = R.groupBy(
    R.pipe(
      R.prop('createdAt'),
      formatISO({ representation: 'date' })
    )
  )(items);

  const list = recentDateStrings(today, oldestDate).map((date, idx) => {
    const subItems = indexByDate[date];
    const isEmpty = !R.has(date, indexByDate);
    const shortDate = R.pipe( R.split('-'), R.tail, R.map(Number), R.join('/'))(date);
    const itemsCount = subItems?.length || 0;
    const viewItemPinCls = '-translate-y-[0.4rem] drop-shadow-[0_0_2px_white]';

    return (
      <li key={date} className='max-h-64 overflow-auto scrollbar-thin'>
        <time
          data-spot-count={itemsCount}
          className={`block px-2 py-1 flex items-center text-slate-900 font-mono data-[spot-count="0"]:text-opacity-50 hover:bg-gray-200`}
          dateTime={date}
        >
          {shortDate}
          <span className={`text-sm ml-auto text-gray-800 ${itemsCount === 0 ? 'text-opacity-50' : ''}`}>
            {itemsCount} 個地點
          </span>
        </time>

        {
          subItems ?
            <ul className='flex flex-row flex-wrap p-1'>
              {subItems.map((i: RecentFollowupsItemProps) => (
                <li key={i.spotId} className={`relative ${viewItem === i ? viewItemPinCls : ''}`}>
                  <Tooltip placement='bottom-end'>
                    <TooltipTrigger className='break-keep w-min cursor-pointer'>
                      <Link
                        href={`/world/area/@${i.lat},${i.lon}`}
                        onClick={(e) => { e.preventDefault(); setViewItem(i); } }
                        className='break-keep w-min cursor-pointer'
                        prefetch={false}
                      >
                        <MapPinIcon className={`cursor-pointer ${mapPinCls(i.spotState)}`} height={24} />
                        {viewItem === i &&
                          <div className='absolute -bottom-[0.4rem] bg-yellow-400 h-1 w-full scale-x-75'></div>
                        }
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent className="p-1 text-xs rounded box-border w-max z-[1002] bg-slate-100 ring-1">
                      {i.city} {i.town}
                    </TooltipContent>
                  </Tooltip>
                </li>
              ))}
            </ul> : null
        }
      </li>
    );
  });

  return (
    <ul className='mt-3 mb-1'>
      {list}
    </ul>
  )
}


export default function RecentFollowups({ items, preloadedAreas, today, oldestDate }: {
  items: RecentFollowupsItemProps[],
  preloadedAreas: GeoSpotsByGeohash,
  today: Date,
  oldestDate: Date
}) {
  const setDefaultViewItem = useSetAtom(setDefaultViewItemAtom);

  useEffect(() => {
    if (items.length) {
      // setDefaultViewItem(items[0]);
    }
  }, [items, setDefaultViewItem])

  return (
    <div className=''>
      <SpotInfo />
      <Areas areas={preloadedAreas} />
      <Followups items={items} today={today} oldestDate={oldestDate} />
    </div>
  );
};
