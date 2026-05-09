import * as R from 'ramda';
import { atom } from 'jotai';
import type {
  GeoSpotsByGeohash,
  GeoSpotsResultFollowup
} from '@/models/spots';
import type { TempMarkerProps, EditingFormType } from '@/components/map/store';
import type { LatLngBounds } from '@/lib/schema';
import type { Map } from 'leaflet';

export type Location = {
  lat: number | null;
  lon: number | null;
};

export const photoLocationAtom = atom<Location>({lat: null, lon: null});

export const mapAtom = atom<Map | null>(null);

export const spotsAtom = atom<GeoSpotsByGeohash>({});
export const mergeSpotsAtom = atom(
  null,
  (get, set, update: GeoSpotsByGeohash) => {
    set(spotsAtom, { ...get(spotsAtom), ...update });
  }
);

export const loadingFollowupsAtom = atom(false);

export const geohashesAtom = atom((get) => {
  return new Set(R.keys(get(spotsAtom)));
});

export const editingFormAtom = atom<EditingFormType>('');

export const mapStatusAtom = atom<string | null>(null);

export const tempMarkerAtom = atom<TempMarkerProps>({
  visible: false,
  lat: 23.97565,
  lon: 120.9738819,
});

export const mergeTempMarkerAtom = atom(
  (get) => get(tempMarkerAtom),
  (get, set, update: TempMarkerProps) => {
    set(tempMarkerAtom, { ...get(tempMarkerAtom), ...update });
  }
);
