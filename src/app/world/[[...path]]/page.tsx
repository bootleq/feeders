import * as R from 'ramda';
import type { Metadata } from "next";
import { auth } from '@/lib/auth';
import { unstable_cache } from '@/lib/cache';
import dynamic from 'next/dynamic';
import geohash from 'ngeohash';
import parse, { HTMLReactParserOptions, Element, Text, DOMNode } from 'html-react-parser';
import { selectOne } from 'css-select';
import { getWorldUsers } from '@/models/users';
import { getBlock } from '@/models/blocks';
import { recentFollowups, geoSpots } from '@/models/spots';
import type { RecentFollowupsResult } from '@/models/spots';
import { formatISO } from '@/lib/date-fp';
import { parsePath, GEOHASH_PRECISION } from './util';
import { userAtom } from '@/components/store';
import Sidebar from '@/components/Sidebar';
import LinkPreview from '@/components/LinkPreview';
import LazyMap from './LazyMap';
import RecentFollowups from './RecentFollowups';
import mapStyles from './map.module.scss';
import { MapPinIcon } from '@heroicons/react/24/solid';

const TW_BOUNDS = [
  [21.7, 118.5], // bottom left
  [25.4, 122.3]  // up right
];
const TW_CENTER = [23.9739, 120.9773];
// const SAMPLE_CENTER = [24.987787927428965, 121.52125946066074];
const SAMPLE_CENTER = [24.87493294850338,121.22191410433534];
const fetchLimit = 200;
const overwriteToday = new Date();
const PRELOAD_AREA_SIZE = 3;

const getSpots = unstable_cache(
  async () => {
    const query = recentFollowups(fetchLimit + 1);
    const items = await query;
    return items;
  },
  ['world', 'spots'],
  {
    tags: ['spots'],
    revalidate: 86400, // 1 day
  }
);

async function preloadGeoSpots(hashes: string[]) {
  if (!hashes.length) {
    return {};
  }
  return await geoSpots(hashes);
}

async function getUser(id: string | undefined) {
  if (id) {
    const users = await getWorldUsers(id);
    if (users) {
      return users[0];
    }
  }

  return null;
}

const helpBodyIconSize = 24;

const helpHtmlParserOption: HTMLReactParserOptions = {
  replace(domNode) {
    if (domNode instanceof Element && domNode.attribs) {
      const { type, name, attribs, children } = domNode;

      if (type === 'tag') {
        if (name === 'span' && attribs.class === 'font-mono italic') {
          const text = (domNode.firstChild as Text).data;
          switch (text) {
            case 'MAP-PIN':
              return <img src="/assets/map-pin.svg" alt='地圖點' className='translate-x-[1px]' width={helpBodyIconSize} height={helpBodyIconSize} />;
              break;
            case 'MAP-PIN-DONE':
              return <img src="/assets/location-check.svg" alt='完成地圖點' className='-translate-y-[1px]' width={helpBodyIconSize} height={helpBodyIconSize} />;
              break;
            case 'MAP-PIN-NEW':
              return <MapPinIcon className='inline fill-red-500 align-text-bottom -mx-[5px]' width={helpBodyIconSize} height={helpBodyIconSize} />
              break;
          }
          return <></>; // remove unrecognized node
        }
      }
      return null; // no touch
    }
  }
};

async function getHelpContent() {
  const help = await getBlock('world/map-help');
  if (!help) {
    return null;
  }
  const content = parse(help.content, helpHtmlParserOption);
  return content;
}

export const metadata: Metadata = {
  title: '世界地圖',
  description: '各地餵食點回報、追蹤、封鎖或監督管理',
};

export default async function Page({ params }: {
  params: { path: string[] }
}) {
  const path = params.path || [];
  const today = overwriteToday || new Date();
  const pathname = `/world/${path.map(s => decodeURIComponent(s)).join('/')}`
  const { lat, lon, mode } = parsePath(pathname);

  const session = await auth();
  const user = await getUser(session?.userId);
  const items = await getSpots();

  const dates = R.uniq(
    items.map(({ createdAt }) => formatISO({ representation: 'date' }, createdAt))
  );

  let hashes = R.take(PRELOAD_AREA_SIZE, items).map(R.prop('geohash'));
  if (user && user.bounds) {
    const revBounds = R.reverse(R.flatten(user.bounds));
    const extraHashes = geohash.bboxes(revBounds[3], revBounds[2], revBounds[1], revBounds[0], GEOHASH_PRECISION);
    hashes = R.pipe(R.concat(extraHashes), R.uniq)(hashes);
  }

  if (lat && lon) {
    hashes.push(geohash.encode(lat, lon, 4))
  }

  const preloadedAreas = await preloadGeoSpots(hashes);
  const helpContent = await getHelpContent();

  return (
    <main className="flex min-h-screen flex-row items-start justify-between">
      <Sidebar className={`max-h-screen scrollbar-thin flex flex-col pb-1 z-[810] bg-gradient-to-br from-stone-50 to-slate-200`}>
        <RecentFollowups user={user} items={items} preloadedAreas={preloadedAreas} today={today} dates={dates} />
      </Sidebar>

      <LazyMap
        preloadedAreas={preloadedAreas}
        helpContent={helpContent}
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

      <LinkPreview />
    </main>
  );
}
