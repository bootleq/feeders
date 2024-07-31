"use client"

import * as R from 'ramda';
import { useState, useEffect, useRef } from 'react';
import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';
import { subDays, format, formatISO, formatDistanceToNow, formatDistance } from '@/lib/date-fp';
import Link from 'next/link';

import { recentFollowups } from '@/models/spots';
import type { GeoSpotsResult, GeoSpotsByGeohash } from '@/models/spots';
import ActionLabel from './ActionLabel';
import FoodLife from './FoodLife';
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
      <strong className='mb-1 block'>
        {spot.spotTitle}
      </strong>

      <div className='flex flex-wrap justify-start items-center'>
        <span data-user-id={spot.userId} className='mr-3 flex'>
          <UserCircleIcon className='fill-current' height={24} />
          USER NAME
        </span>
        {
          R.any(R.isNotNil)(R.props(['city', 'town'], spot)) ?
            <span className='text-sm opacity-60 mr-3'>{`${spot.city}${spot.town}`}</span>
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

function Areas({ areas }: {
  areas: GeoSpotsByGeohash
}) {
  const picked: [string, GeoSpotsResult[number], number][] = R.toPairs(areas).map(([geohash, items]) => {
    const spot = R.sortBy(R.prop('latestFollowAt'), items)[0];
    return [geohash, spot, items.length];
  });

  return (
    <div className='mt-4 mb-2 p-1 overflow-visible'>
      前往區域
      <ul className='flex py-1 overflow-hidden scrollbar-thin'>
        {picked.map(([geohash, { lat, lon, city, town }, spotsCount]) => {
          return (
            <li key={geohash} className={`relative rounded p-1 mx-1 grow-0 text-center ${false ? 'bg-slate-300/75' : 'bg-slate-200'}`}>
              <Link
                href={`/world/area/@${lat},${lon}`}
                onClick={visitArea(lat, lon)}
                className='break-keep w-min cursor-pointer'
                prefetch={false}
              >
                {city} {town}
              </Link>
              <i className='absolute font-mono -top-3 right-0 drop-shadow'>
                {spotsCount}
              </i>
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
      <li key={date} className=''>
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
                  <MapPinIcon className={`cursor-pointer ${mapPinCls(i.spotState)}`} onClick={() => setViewItem(i)} data-lat={i.lat} data-lon={i.lon} height={24} />
                  {viewItem === i &&
                    <div className='absolute -bottom-[0.4rem] bg-yellow-400 h-1 w-full scale-x-75'></div>
                  }
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
