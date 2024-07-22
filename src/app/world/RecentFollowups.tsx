"use client"

import * as R from 'ramda';
import { subDays, formatISO } from '@/lib/date-fp';
import { recentFollowups } from '@/models/spots';
import { MapPinIcon } from '@heroicons/react/24/solid';

type RecentFollowupsItemProps = Awaited<ReturnType<typeof recentFollowups>>[number];

function SpotInfo({ spot }: { spot: RecentFollowupsItemProps | null}) {
  return (
    <div className='bg-lime-300 aspect-[14/9] max-w-screen-sm'>
      動態
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
                  <MapPinIcon className={mapPinCls(i.spotState)} data-lat={i.lat} data-lon={i.lon} height={24} />
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
  return (
    <>
      <SpotInfo spot={items[0]} />
      <Followups items={items} today={today} oldestDate={oldestDate} />
    </>
  );
};
