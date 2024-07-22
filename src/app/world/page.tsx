import dynamic from 'next/dynamic';
import * as R from 'ramda';
import { db } from '@/lib/db';
import { recentFollowups } from '@/models/spots';
import { subDays, format, formatISO } from '@/lib/date-fp';
import { HandThumbDownIcon } from '@heroicons/react/24/solid';
import { MapPinIcon } from '@heroicons/react/24/solid';
import Sidebar from '@/components/Sidebar';

export const runtime = 'edge';

const LazyMap = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

const TW_CENTER = [23.9739, 120.9773];
const trackDays = 5
const fetchLimit = 200;
const overwriteToday = new Date();

async function getSpots(oldestDate: Date) {
  const query = recentFollowups(oldestDate, fetchLimit + 1);
  const items = await query;
  return items;
}

type RecentFollowupsItemProps = Awaited<ReturnType<typeof recentFollowups>>[number];

function recentDateStrings(today: Date, oldestDate: Date) {
  const days = R.range(0, trackDays);
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

function SpotInfo({ spot }: { spot: RecentFollowupsItemProps | null}) {
  return (
    <div className='bg-lime-300 aspect-[14/9] max-w-screen-sm'>
      動態
    </div>
  );
}

function RecentFollowups({ items, today, oldestDate }: {
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

export default async function Page() {
  const today = overwriteToday || new Date();
  const oldestDate = subDays(trackDays, today);
  const items = await getSpots(oldestDate);

  return (
    <main className="flex min-h-screen flex-row items-start justify-between">
      <Sidebar className='flex flex-col px-2 py-1 font-mono z-[410]'>
        <SpotInfo spot={items[0]} />

        <RecentFollowups items={items} today={today} oldestDate={oldestDate} />

        <HandThumbDownIcon className='mt-auto fill-current size-7' height={24} />
      </Sidebar>

      <LazyMap preferCanvas={true} zoom={8} center={TW_CENTER} zoomControl={false}></LazyMap>
    </main>
  );
}
