import * as R from 'ramda';
import dynamic from 'next/dynamic';
import geohash from 'ngeohash';
import { recentFollowups, geoSpots } from '@/models/spots';
import type { RecentFollowupsResult } from '@/models/spots';
import { subDays } from '@/lib/date-fp';
import { parsePath } from './util';
import Sidebar from '@/components/Sidebar';
import RecentFollowups from './RecentFollowups';
import Nav from './Nav';

export const runtime = 'edge';

const LazyMap = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

const TW_BOUNDS = [
  [21.7, 118.5], // bottom left
  [25.4, 122.3]  // up right
];
const TW_CENTER = [23.9739, 120.9773];
// const SAMPLE_CENTER = [24.987787927428965, 121.52125946066074];
const SAMPLE_CENTER = [24.87493294850338,121.22191410433534];
const trackDays = 5
const fetchLimit = 200;
const overwriteToday = new Date();
const PRELOAD_AREA_SIZE = 3;

async function getSpots(oldestDate: Date) {
  const query = recentFollowups(oldestDate, fetchLimit + 1);
  const items = await query;
  return items;
}

async function preloadGeoSpots(hashes: string[]) {
  const query = geoSpots(hashes);
  const items = await query;
  const grouped = R.groupBy(i => i.geohash || '', items);
  return R.reject(R.isNil, grouped);
}

export default async function Page({ params }: {
  params: { path: string[] }
}) {
  const path = params.path || [];
  const today = overwriteToday || new Date();
  const oldestDate = subDays(trackDays, today);
  const pathname = `/world/${path.map(s => decodeURIComponent(s)).join('/')}`
  const { lat, lon, mode } = parsePath(pathname);

  const items = await getSpots(oldestDate);
  const hashes = R.take(PRELOAD_AREA_SIZE, items).map(R.prop('geohash'));

  if (lat && lon) {
    hashes.push(geohash.encode(lat, lon, 4))
  }

  const preloadedAreas = await preloadGeoSpots(hashes);

  return (
    <main className="flex min-h-screen flex-row items-start justify-between">
      <Sidebar className={`max-h-screen scrollbar-thin flex flex-col pb-1 z-[410] bg-gradient-to-br from-stone-50 to-slate-200`}>
        <RecentFollowups items={items} preloadedAreas={preloadedAreas} today={today} oldestDate={oldestDate} />
        <Nav />
      </Sidebar>

      <LazyMap
        preloadedAreas={preloadedAreas}
        preferCanvas={true}
        center={SAMPLE_CENTER}
        minZoom={8}
        zoom={8}
        maxZoom={20}
        maxBounds={TW_BOUNDS}
        maxBoundsViscosity={0.5}
        zoomControl={false}
      >
      </LazyMap>
    </main>
  );
}
