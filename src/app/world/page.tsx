import dynamic from 'next/dynamic';
import * as R from 'ramda';
import { db } from '@/lib/db';
import { recentFollowups } from '@/models/spots';
import { subDays, formatISO } from '@/lib/date-fp';
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
                  <MapPinIcon className='fill-current' data-lat={i.lat} data-lon={i.lon} height={24} />
                  {i.spotState}
                  <p>
                    {i.action}
                  </p>
                </li>
              ))}
            </ul> : null
        }
      </li>
    );
  });

  return <ul>{list}</ul>
}

export default async function Page() {
  const today = new Date();
  const oldestDate = subDays(trackDays, today);
  const items = await getSpots(oldestDate);

  return (
    <main className="flex min-h-screen flex-row items-start justify-between">
      <Sidebar className=' flex flex-col px-3 py-1 font-mono z-[410]'>
        <h2>動態</h2>

        <RecentFollowups items={items} today={today} oldestDate={oldestDate} />
      </Sidebar>

      <LazyMap preferCanvas={true} zoom={8} center={TW_CENTER} zoomControl={false}></LazyMap>
    </main>
  );
}
