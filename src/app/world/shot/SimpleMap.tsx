"use client"

import * as R from 'ramda';
import { useEffect } from 'react';
import geohash from 'ngeohash';
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import type { LeafletMouseEvent } from 'leaflet';
import { atom, useSetAtom, useAtomValue } from 'jotai';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'motion/react';
import Alerts from '@/components/Alerts';
import { GEOHASH_PRECISION } from '@/app/world/mapUtil';
import { useDebouncedCallback } from 'use-debounce';
import type { GeoSpotsResult, GeoSpotsByGeohash } from '@/models/spots';
import { nowAtom, alertsAtom, addAlertAtom, dismissAlertAtom } from '@/components/store';
import Spinner from '@/assets/spinner.svg';
import {
  photoLocationAtom,
  mapAtom,
  spotsAtom,
  mergeSpotsAtom,
  geohashesAtom,
  mergeTempMarkerAtom,
  editingFormAtom,
  loadingFollowupsAtom,
  toggleHelpAtom,
} from './store';

import SpotMarkers from '@/components/map/SpotMarkers';
import TempMarker from '@/components/map/TempMarker';
import Help from '@/components/map/Help';
import makeSpotFetcherAtoms from '@/components/map/makeSpotFetcherAtoms';
import mapStyles from '@/components/map/map.module.scss';
import HelpControl from '@/app/world/[[...path]]/map-controls/HelpControl';

type MapProps = {
  allGeoHashes: Set<string>;
  children?: React.ReactNode;
  className?: string;
  width?: string | number;
  height?: string | number;
  [key: string]: any;
};

const D1_PARAM_LIMIT = 100;

const { spotLoadingAtom, fetchSpotsAtom } = makeSpotFetcherAtoms(spotsAtom, mergeSpotsAtom);
const loadingAtom = atom((get) => get(spotLoadingAtom) || get(loadingFollowupsAtom));

function MapUser({
  allGeoHashes,
}: {
  allGeoHashes: Set<string>
}) {
  const setMap = useSetAtom(mapAtom);
  const setNow = useSetAtom(nowAtom);
  const geoSet = useAtomValue(geohashesAtom);
  const fetchSpots = useSetAtom(fetchSpotsAtom);
  const setTempMarker = useSetAtom(mergeTempMarkerAtom);
  const addAlert = useSetAtom(addAlertAtom);

  const debouncedMoveEnd = useDebouncedCallback(() => {
    const bounds = map.getBounds();
    const hashes = new Set(
      geohash.bboxes(
        bounds.getSouth(),
        bounds.getWest(),
        bounds.getNorth(),
        bounds.getEast(),
        GEOHASH_PRECISION
      )
    );

    if (hashes.isDisjointFrom(allGeoHashes)) {
      return;
    }

    const newHash = hashes.difference(geoSet);
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

export default function SimpleMap({ allGeoHashes, preloadedAreas, helpContent, children, className, width, height, ...rest }: MapProps) {
  const map = useAtomValue(mapAtom);
  const location = useAtomValue(photoLocationAtom);
  const setTempMarker = useSetAtom(mergeTempMarkerAtom);
  const toggleHelp = useSetAtom(toggleHelpAtom);

  const { lon, lat } = location;

  const spots = useAtomValue(spotsAtom);
  let filteredSpots = R.pipe(
    R.toPairs,
    R.filter(([k, v]) => R.isNotEmpty(v)),
    R.map(R.last),
    R.flatten,
  )(spots) as GeoSpotsResult[];

  useEffect(() => {
    if (lat && lon) {
      setTempMarker({ visible: true, lat, lon });
      if (map) {
        map.fire('moveend')
        map.eachLayer(layer => {
          if ((layer.options as any)['marker-type'] === 'TempMarker') {
            layer.openPopup();
          }
        })
      }
    }
  }, [lat, lon, map, setTempMarker]);

  if (!lat || !lon) {
    return (
      <div className='p-3 text-slate-700'>
        輸入照片、取得地理資訊後才會載入地圖。
      </div>
    );
  }

  return (
    <>
      <MapContainer center={[lat, lon]} className={`w-full h-full relative ring ring-red-400 ${className || ''}`} {...rest}>
        <MapUser allGeoHashes={allGeoHashes} />
        <TileLayer
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
          maxZoom={20}
          maxNativeZoom={18}
        >
        </TileLayer>
        <SpotMarkers spots={filteredSpots} readonly editingFormAtom={editingFormAtom} />

        <TempMarker markerAtom={mergeTempMarkerAtom} editingFormAtom={editingFormAtom} mergeSpotsAtom={mergeSpotsAtom} />

        <HelpControl className={mapStyles['reset-view-ctrl']} title='說明' position='bottomright' onClick={toggleHelp} />
      </MapContainer>

      <Alerts itemsAtom={alertsAtom} dismissAtom={dismissAlertAtom} />
      <Help content={helpContent} toggleAtom={toggleHelpAtom} />
      <LoadingIndicator />
    </>
  );
};
