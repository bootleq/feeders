import * as R from 'ramda';
import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';
import { recentFollowups } from '@/models/spots';
import type { GeoSpotsResult, WorldUserResult, RecentFollowupsItemProps } from '@/models/spots';
import type { LatLngBounds } from '@/lib/schema';
import Leaflet from 'leaflet';

export const userAtom = atom<WorldUserResult | null>(null);
export const mapAtom = atom<Leaflet.Map | null>(null);

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

export type AreaPickerAtom = {
  id: number | null,
  bounds: LatLngBounds | null,
} | null;
export const areaPickerAtom = atom<AreaPickerAtom>(null);

export const viewItemAtom = atom<RecentFollowupsItemProps | null>(null);
