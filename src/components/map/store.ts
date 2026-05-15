import * as R from 'ramda';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import type {
  GeoSpotsResultFollowup
} from '@/models/spots';

export type TempMarkerProps = {
  visible?: boolean,
  lat?: number,
  lon?: number,
  defaultDate?: Date,
};

export type EditingFormType = 'spot' | 'followup' | 'amendSpot' | 'amendFollowup' | '';

export const loadingFollowupsAtom = atom(false);

export const spotFollowupsAtom = atom<Record<number, GeoSpotsResultFollowup[]>>({});
export const mergeSpotFollowupsAtom = atom(
  null,
  (get, set, update: [spotId: number, items: GeoSpotsResultFollowup[]]) => {
    const [spotId, items] = update;
    if (R.isEmpty(items)) return;

    const o = get(spotFollowupsAtom);

    if (!o) return set(spotFollowupsAtom, { [spotId]: items });

    set(spotFollowupsAtom, { ...o, [spotId]: items });
  }
);
