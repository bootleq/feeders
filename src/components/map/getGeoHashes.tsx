import * as R from 'ramda';
import { allGeoHashes } from '@/models/spots';
import { unstable_cache } from '@/lib/cache';

const CACHE_SIZE = 444; // if the length of GeoHashes exceeds this, give up using it as cache (and return empty Set)

export const getItems = unstable_cache(
  async () => {
    console.log({ '💀 cache thru': 'components getGeoHashes' });

    const items = await allGeoHashes(CACHE_SIZE + 1);
    const hashes = R.pluck('hash', items);

    if (hashes.length > CACHE_SIZE) {
      return new Set([]);
    }

    return new Set(hashes);
  },
  ['api', 'geohashes'],
  {
    tags: ['geohash'],
  }
);

export default async function getGeoHashes() {
  const items = await getItems();

  return items;
}
