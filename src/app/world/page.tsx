import dynamic from 'next/dynamic';
import { recentFollowups } from '@/models/spots';
import { subDays } from '@/lib/date-fp';
import Sidebar from '@/components/Sidebar';
import RecentFollowups from './RecentFollowups';
import { HandThumbDownIcon } from '@heroicons/react/24/solid';

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

export default async function Page() {
  const today = overwriteToday || new Date();
  const oldestDate = subDays(trackDays, today);
  const items = await getSpots(oldestDate);

  return (
    <main className="flex min-h-screen flex-row items-start justify-between">
      <Sidebar className='flex flex-col pb-1 z-[410] bg-gradient-to-br from-stone-50 to-slate-200'>
        <RecentFollowups items={items} today={today} oldestDate={oldestDate} />
        <HandThumbDownIcon className='mt-auto ml-1 fill-current size-7' height={24} />
      </Sidebar>

      <LazyMap preferCanvas={true} zoom={8} center={TW_CENTER} zoomControl={false}></LazyMap>
    </main>
  );
}
