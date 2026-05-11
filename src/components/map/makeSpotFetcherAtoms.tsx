import * as R from 'ramda';
import { atom, useSetAtom, useAtomValue } from 'jotai';
import type { PrimitiveAtom, WritableAtom  } from 'jotai';
import { jsonReviver } from '@/lib/utils';
import type { GeoSpotsByGeohash } from '@/models/spots';
import { addAlertAtom } from '@/components/store';

const loadingHashesAtom = atom<string[]>([]);
const loadedHashesAtom = atom<string[]>([]);

type ItemsGeoSpotsByGeohash = { items: GeoSpotsByGeohash }

export default function makeSpotFetcherAtoms(
  spotsAtom: PrimitiveAtom<GeoSpotsByGeohash>,
  mergeSpotsAtom: WritableAtom<null, [GeoSpotsByGeohash], void>,
) {
  const spotLoadingAtom = atom((get) => R.isNotEmpty(get(loadingHashesAtom)));

  const fetchSpotsAtom = atom(
    null,
    async (get, set, geohash: string[]) => {
      const loadingHashes = get(loadingHashesAtom);
      const loadedHashes = R.union(get(loadedHashesAtom), Object.keys(get(spotsAtom)));

      const staleHashes = R.difference(
        R.difference(geohash, loadedHashes),
        loadingHashes
      );

      if (R.isEmpty(staleHashes)) {
        return; // already loading, do nothing
      }
      set(loadingHashesAtom, R.union(loadingHashes, staleHashes));

      try {
        const response = await fetch(`/api/spots/${staleHashes.sort()}/`);
        const json = await response.text();
        const fetched: ItemsGeoSpotsByGeohash = JSON.parse(json, jsonReviver);
        if (response.ok) {
          set(mergeSpotsAtom, { ...fetched.items });
          set(loadedHashesAtom, R.union(get(loadedHashesAtom), staleHashes));
        } else {
          const errorNode = <><code className='font-mono mr-1'>{response.status}</code>無法取得資料</>;
          set(addAlertAtom, 'error', errorNode);
        }
        set(loadingHashesAtom, R.difference(get(loadingHashesAtom), staleHashes));
      } catch (e) {
        const errorNode = <span>{String(e)}</span>;
        set(addAlertAtom, 'error', errorNode);
        set(loadingHashesAtom, R.difference(get(loadingHashesAtom), staleHashes));
      }
    }
  );

  return { spotLoadingAtom, fetchSpotsAtom };
}
