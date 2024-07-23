"use client"

import * as R from 'ramda';
import { useState, useEffect } from 'react';
import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';
import { subDays, formatISO, formatDistanceToNow } from '@/lib/date-fp';
import { recentFollowups } from '@/models/spots';
import { MapPinIcon } from '@heroicons/react/24/solid';

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
      cls = 'bg-slate-400 opacity-70';
      break;
    case 'tolerated':
      cls = 'bg-blue-700';
      break;
    default:
      cls = 'bg-current';
  }

  return (
    <span className={`inline-block rounded-full px-2 mr-1 text-white font-normal ${cls}`}>
      {children}
    </span>
  );
}

function SpotInfo() {
  const spot = useAtomValue(viewItemAtom);

  if (R.isEmpty(spot) || R.isNil(spot)) {
    return (
      <div className='bg-lime-300 aspect-[14/9]'>
      </div>
    );
  }

  return (
    <div className='bg-lime-300 aspect-[14/9]'>
      <strong>
        <StateLabel spotState={spot.spotState}>{spot.spotState} </StateLabel>
        {spot.spotTitle}
      </strong>
      <div>
        <span data-user-id={spot.userId}>
          USER
        </span>

        <time className='' dateTime={`${spot.createdAt}`}>
          {formatDistanceToNow(spot.createdAt)}
        </time>

        {
          spot.district ? <span>在 {spot.district}</span> : ''
        }
        {spot.action}
      </div>

      <div>
        {spot.desc}
      </div>

      <div className='aspect-[4/3] ring-1 max-w-screen-sm'>
        (IMG)
      </div>
    </div>
  );
}

function recentDateStrings(today: Date, oldestDate: Date) {
  const days = R.range(0, 5); // FIXME: 5 is magic
  return days
    .map(d => subDays(d, today))
    .map(formatISO({ representation: 'date' }));
}

function dateColorCls(age: number, itemSize: number) {
  if (itemSize === 0) {
    return 'text-opacity-50';
  }
  return '';
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
  const setViewItem = useSetAtom(viewItemAtom);

  if (!items?.length) {
    return <p>沒有新發現</p>;
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

    return (
      <li key={date}>
        <time className={`text-slate-900 ${dateColorCls(idx, subItems?.length || 0)}`} dateTime={`${date}`}>
          {date}{idx === 0 ? '（今天）' : null}
        </time>

        {
          subItems ?
            <ul className='flex flex-row flex-wrap'>
              {subItems.map((i: RecentFollowupsItemProps) => (
                <li key={i.spotId}>
                  <MapPinIcon className={`cursor-pointer ${mapPinCls(i.spotState)}`} onClick={() => setViewItem(i)} data-lat={i.lat} data-lon={i.lon} height={24} />
                </li>
              ))}
            </ul> : null
        }
      </li>
    );
  });

  return (
    <ul className=''>
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
    <>
      <SpotInfo />
      <Followups items={items} today={today} oldestDate={oldestDate} />
    </>
  );
};
