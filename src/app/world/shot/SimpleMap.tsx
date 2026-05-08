"use client"

import * as R from 'ramda';
import { useEffect } from 'react';
import geohash from 'ngeohash';
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import type { LeafletMouseEvent } from 'leaflet';
import { atom, useSetAtom, useAtomValue } from 'jotai';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'motion/react';
import Alerts from '@/components/Alerts';
import { jsonReviver } from '@/lib/utils';
import { GEOHASH_PRECISION } from '@/app/world/mapUtil';
import { useDebouncedCallback } from 'use-debounce';
import type { GeoSpotsResult, GeoSpotsByGeohash } from '@/models/spots';
import { nowAtom, alertsAtom, addAlertAtom, dismissAlertAtom } from '@/components/store';
import Spinner from '@/assets/spinner.svg';
import {
  mapAtom,
  spotsAtom,
  mergeSpotsAtom,
  geohashesAtom,
  mergeTempMarkerAtom,
  editingFormAtom,
  loadingFollowupsAtom,
} from './store';

import SpotMarkers from '@/components/map/SpotMarkers';
import TempMarker from '@/components/map/TempMarker';

type MapProps = {
  children?: React.ReactNode;
  className?: string;
  center?: [number, number];
  width?: string | number;
  height?: string | number;
  [key: string]: any;
};

const D1_PARAM_LIMIT = 100;

const loadingHashesAtom = atom<string[]>([]);
const loadedHashesAtom = atom<string[]>([]);
const loadingAtom = atom((get) => R.isNotEmpty(get(loadingHashesAtom)) || get(loadingFollowupsAtom));

type ItemsGeoSpotsByGeohash = { items: GeoSpotsByGeohash }
export const fetchSpotsAtom = atom(
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

function MapUser(props: {}) {
  const setMap = useSetAtom(mapAtom);
  const setNow = useSetAtom(nowAtom);
  const geoSet = useAtomValue(geohashesAtom);
  const fetchSpots = useSetAtom(fetchSpotsAtom);
  const setTempMarker = useSetAtom(mergeTempMarkerAtom);
  const addAlert = useSetAtom(addAlertAtom);

  const debouncedMoveEnd = useDebouncedCallback(() => {
    const bounds = map.getBounds();
    const hashes = geohash.bboxes(
      bounds.getSouth(),
      bounds.getWest(),
      bounds.getNorth(),
      bounds.getEast(),
      GEOHASH_PRECISION
    );

    const newHash = new Set(hashes).difference(geoSet);
    if (newHash.size > 0) {
      fetchSpots(
        R.take(D1_PARAM_LIMIT, Array.from(newHash))
      );
    }
  }, 400);

  const map = useMapEvents({
    click: (e: LeafletMouseEvent) => {
      const anyPopup = Boolean(map.getContainer().querySelector('.leaflet-popup'));
      if (!anyPopup) {
        const point = e.latlng;
        setTempMarker({ visible: true, lat: point.lat, lon: point.lng });
      }
    },
    moveend: debouncedMoveEnd,
  });

  useEffect(() => {
    setNow(new Date());
  }, [setNow]);

  useEffect(() => {
    setMap(map);
  }, [map, setMap]);

  return null;
}

function LoadingIndicator(params: any) {
  const loading = useAtomValue(loadingAtom);
  const motionProps = {
    exit: {
      opacity: 0,
      transition: { duration: 1.2 },
    },
  };
  const iconSize = 24;

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        { loading &&
          <div className='absolute z-[900] inset-x-1/2 inset-y-1/2 -translate-x-1/2 -translate-y-1/2'>
            <m.div {...motionProps}>
              <Spinner className='scale-[10]' width={iconSize} height={iconSize} aria-label='讀取中' />
            </m.div>
          </div>
        }
      </AnimatePresence>
    </LazyMotion>
  );
}

export default function SimpleMap({ center, preloadedAreas, helpContent, children, className, width, height, ...rest }: MapProps) {
  const map = useAtomValue(mapAtom);
  const setTempMarker = useSetAtom(mergeTempMarkerAtom);

  const spots = useAtomValue(spotsAtom);
  let filteredSpots = R.pipe(
    R.toPairs,
    R.filter(([k, v]) => R.isNotEmpty(v)),
    R.map(R.last),
    R.flatten,
  )(spots) as GeoSpotsResult[];

  useEffect(() => {
    if (center) {
      setTempMarker({ visible: true, lat: center[0], lon: center[1] });
      map?.fire('moveend')
    }
  }, [center, map, setTempMarker]);

  return (
    <>
      <MapContainer center={center} className={`w-full h-full relative ring ring-red-400 ${className || ''}`} {...rest}>
        <MapUser/>
        <TileLayer
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
          maxZoom={20}
          maxNativeZoom={18}
        >
        </TileLayer>
        <SpotMarkers spots={filteredSpots} readonly editingFormAtom={editingFormAtom} />

        <TempMarker markerAtom={mergeTempMarkerAtom} editingFormAtom={editingFormAtom} />
      </MapContainer>

      <Alerts itemsAtom={alertsAtom} dismissAtom={dismissAlertAtom} />
      <LoadingIndicator />
    </>
  );
};
