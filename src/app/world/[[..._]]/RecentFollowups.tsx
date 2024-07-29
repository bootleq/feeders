"use client"

import * as R from 'ramda';
import { useState, useEffect, useRef } from 'react';
import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';
import { subDays, format, formatISO, formatDistanceToNow, formatDistance } from '@/lib/date-fp';
import { recentFollowups } from '@/models/spots';
import { MapPinIcon } from '@heroicons/react/24/solid';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { ArrowLongRightIcon } from '@heroicons/react/24/solid';

type RecentFollowupsItemProps = Awaited<ReturnType<typeof recentFollowups>>[number];

const viewItemAtom = atom<RecentFollowupsItemProps | null>(null);
const setDefaultViewItemAtom = atom(
  null,
  (get, set, update: RecentFollowupsItemProps) => set(viewItemAtom, (value) => (R.isNil(value) ? update : value))
)

function StateLabel({ spotState, children }: {
  spotState: string,
  children?: React.ReactNode
}) {
  let cls = '';

  switch (spotState) {
    case 'dirty':
      cls = 'bg-amber-950';
      break;
    case 'clean':
      cls = 'bg-green-700';
      break;
    case 'tolerated':
      cls = 'bg-blue-700';
      break;
    default:
      cls = 'bg-current';
  }

  return (
    <span className={`inline-block rounded-md text-sm px-1 mr-1 text-white font-normal ${cls}`}>
      {children}
    </span>
  );
}

function ActionLabel({ action, children }: {
  action: string,
  children?: React.ReactNode
}) {
  let cls = '';
  let t: { [key: string]: string } = {
    see: '看見',
    remove: '移除',
    talk: '溝通',
    investig: '調查',
    power: '公權力',
    coop: '互助',
    downvote: '扣分',
  };

  switch (action) {
    case 'see':
      cls = 'bg-slate-900 opacity-70';
      break;
    case 'talk':
      cls = 'bg-yellow-600';
      break;
    case 'remove':
      cls = 'bg-green-700';
      break;
    case 'investig':
      cls = 'bg-blue-700';
      break;
    case 'downvote':
      cls = 'bg-red-700';
      break;
    default:
      cls = 'bg-slate-900';
  }

  return (
    <span className={`inline-block rounded-lg px-2 text-white text-sm font-normal flex items-center ${cls}`}>
      {t[action]}
    </span>
  );
}

function FoodLife({ spot, now }: {
  spot: RecentFollowupsItemProps,
  now: Date | null
}) {
  if (!now) {
    return;
  }
  const { spawnedAt, removedAt, spotState } = spot;
  const formatTime = format({}, 'H:m');
  const spawned = spawnedAt ? formatTime(spawnedAt) : '??';
  const removed = removedAt ? formatTime(removedAt) : '??';
  let duration = '';

  if (spawnedAt) {
    duration = formatDistance(removedAt || now, spawnedAt);
  }

  return (
    <div className='flex items-center flex-wrap'>
      <StateLabel spotState={spotState}>{spotState}</StateLabel>
      <span className='whitespace-nowrap'>
        {spot.material}
      </span>
      <span className='text-sm whitespace-nowrap font-mono'>
        （{duration.replace('大約', '').trim()}）
      </span>
      <div className='text-xs font-mono opacity-60 flex items-center'>
        {spawned}
        <ArrowLongRightIcon className='inline fill-gray-600 mx-[-9px]' width={48} height={24} />
        {removed}
      </div>
    </div>
  );
}

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

function Areas({ items }: {
  items: RecentFollowupsItemProps[],
}) {
  const viewItem = useAtomValue(viewItemAtom);
  let viewingAreaKey = '';

  if (viewItem && viewItem.lat && viewItem.lon) {
    viewingAreaKey = R.filter(R.isNotNil, [viewItem.city, viewItem.town]).join(' ');
  }

  type ByAreaData = {
    [key: string]: {  // city + town
      lat: number
      lon: number
      maxFollowCount: number
      totalFollows: number  // will only pick 1 spot with max followups, but sums all followups together
    }
  }
  type ByAreaValue = ByAreaData[string];

  const byArea = items.reduce((m: ByAreaData, i) => {
    const { city, town, lat, lon, followCount = 0 } = i;
    const key = R.filter(R.isNotNil, [city, town]).join(' ');

    if (!key.length || R.isNil(lat) || R.isNil(lon)) {
      return m;
    }

    if (!m[key]) {
      m[key] = { lat, lon, maxFollowCount: followCount, totalFollows: followCount };
    } else {
      if (followCount > m[key].maxFollowCount) {
        Object.assign(m, { lat, lon, maxFollowCount: followCount });
      }
      m[key].totalFollows += followCount;
    }

    return m;
  }, {} as ByAreaData);

  let pickedAreas = R.pipe(
    R.toPairs,
    R.sortBy(([key, value]: [string, ByAreaValue]) => {
      if (key === viewingAreaKey) {
        return Infinity;
      }
      return value.totalFollows;
    }),
    R.reverse,
    R.take(5),
  )(byArea as ByAreaData) as [string, ByAreaValue][];

  return (
    <div className='mt-4 mb-2 p-1 overflow-visible'>
      前往區域
      <ul className='flex py-1 overflow-hidden scrollbar-thin'>
        {pickedAreas.map(([name, { lat, lon, totalFollows }]) => {
          const isCurrent = name === viewingAreaKey;

          return (
            <li key={name} className={`relative rounded p-1 mx-1 grow-0 text-center ${isCurrent ? 'bg-slate-300/75' : 'bg-slate-200'}`}>
              <div className='break-keep w-min cursor-pointer' onClick={visitArea(lat, lon)}>
                {name}
              </div>
              <i className='absolute font-mono -top-3 right-0 drop-shadow'>
                {totalFollows}
              </i>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

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
                <li key={i.spotId} className={`relative ${viewItem === i ? '-translate-y-[0.4rem]' : ''}`}>
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


export default function RecentFollowups({ items, today, oldestDate }: {
  items: RecentFollowupsItemProps[],
  today: Date,
  oldestDate: Date
}) {
  const setDefaultViewItem = useSetAtom(setDefaultViewItemAtom);

  useEffect(() => {
    if (items.length) {
      setDefaultViewItem(items[0]);
    }
  }, [items, setDefaultViewItem])

  return (
    <div className=''>
      <SpotInfo />
      <Areas items={items} />
      <Followups items={items} today={today} oldestDate={oldestDate} />
    </div>
  );
};
