import * as R from 'ramda';
import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';
import type { GeoSpotsResult, GeoSpotsByGeohash } from '@/models/spots';

export type SpotsAtom = {
  [key: string]: GeoSpotsResult
}
export const spotsAtom = atom({});

export const mergeSpotsAtom = atom(
  null,
  (get, set, update: SpotsAtom) => {
    set(spotsAtom, { ...get(spotsAtom), ...update });
  }
);

export const geohashesAtom = atom((get) => {
  return new Set(R.keys(get(spotsAtom)));
});
