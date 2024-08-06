"use client"

import Leaflet from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import type { Marker as LeafletMarker } from 'leaflet';
import type { LatLngExpression } from 'leaflet';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';
import { mergeTempMarkerAtom } from '@/app/world/[[...path]]/store';
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";

import mapStyles from './map.module.scss';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';

const MarkerIcon = new Leaflet.DivIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="red" class="${mapStyles['temp-marker']} size-9 -mt-6 -ml-3 opacity-90 drop-shadow-[0_0_2px_white]">
    <path fill-rule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clip-rule="evenodd" /></svg>`,
  className: 'leaflet-div-marker ring-2 ring',
  popupAnchor: [0, -27],
})

export default function TempMarker() {
  const [marker, setMarker] = useAtom(mergeTempMarkerAtom);
  const { visible, lat, lon } = marker;

  const markerRef = useRef<LeafletMarker>(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const pos = marker.getLatLng();
          setMarker({ lat: pos.lat, lon: pos.lng })
        }
      },
    }),
    [setMarker],
  );

  const cancel = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setMarker({ visible: false });
  }, [setMarker]);

  if (!visible) {
    return;
  }

  return (
    <Marker
      draggable={true}
      icon={MarkerIcon}
      eventHandlers={eventHandlers}
      position={[lat, lon]}
      ref={markerRef}>
      <Popup minWidth={90}>
        <div className='flex flex-col items-center text-base'>
          新的地點
          <div className='flex items-center gap-x-2 mt-3 text-sm'>
            <button className={`btn p-1 bg-slate-100 ring-1 flex items-center hover:bg-white`}>
              <PencilSquareIcon className='stroke-slate-700' height={20} />
              編輯
            </button>

            <button className={`btn p-1 bg-slate-100 ring-1 flex items-center hover:bg-white`} onClick={cancel}>
              <XMarkIcon className='stroke-red-700' height={20} />
              取消
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};
