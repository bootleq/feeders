import * as R from 'ramda';
import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';
import type {
  RecentFollowupsItemProps,
  GeoSpotsByGeohash,
  GeoSpotsResultFollowup
} from '@/models/spots';
import { spotFollowups, type LatLngBounds } from '@/lib/schema';
import Leaflet from 'leaflet';

export const mapAtom = atom<Leaflet.Map | null>(null);

export const spotsAtom = atom<GeoSpotsByGeohash>({});
export const mergeSpotsAtom = atom(
  null,
  (get, set, update: GeoSpotsByGeohash) => {
    set(spotsAtom, { ...get(spotsAtom), ...update });
  }
);

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
export const loadingFollowupsAtom = atom(false);

export const geohashesAtom = atom((get) => {
  return new Set(R.keys(get(spotsAtom)));
});

export type AreaPickerAtom = {
  id: number | null,
  bounds: LatLngBounds | null,
} | null;
export const areaPickerAtom = atom<AreaPickerAtom>(null);

export const editingFormAtom = atom<'spot' | 'followup' | 'amendSpot' | 'amendFollowup' | ''>('');

export const statusAtom = atom<string | null>(get => {
  if (get(areaPickerAtom)) {
    return 'areaPicker';
  }
  const form = get(editingFormAtom);
  if (R.isNotEmpty(form)) {
    return `${form}Form`; // e.g., spotForm, followupForm, amendSpotForm, amendFollowupForm
  }
  return null;
});

export const districtsModeAtom = atom<number>(0);
export const mapStatusAtom = atom<string | null>(null);

export const showHelpAtom = atom(false);
export const toggleHelpAtom = atom(
  get => get(showHelpAtom),
  (get, set) => {
    set(showHelpAtom, R.not);
  }
);

export const loadingDistrictAtom = atom(false);
export const advanceDistrictModeAtom = atom(
  get => get(districtsModeAtom),
  (get, set, update) => {
    set(districtsModeAtom, R.pipe(R.inc, R.flip(R.modulo)(3)));
  }
);

export const viewItemAtom = atom<RecentFollowupsItemProps | null>(null);

export const tempMarkerAtom = atom({
  visible: false,
  lat: 23.97565,
  lon: 120.9738819,
});

export const mergeTempMarkerAtom = atom(
  (get) => get(tempMarkerAtom),
  (get, set, update: { visible?: boolean, lat?: number, lon?: number }) => {
    set(tempMarkerAtom, { ...get(tempMarkerAtom), ...update });
  }
);
