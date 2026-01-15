"use client"

import * as R from 'ramda';
import { useEffect, useCallback, useRef } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import type { GeoJsonObject, Feature } from 'geojson';
import Leaflet from 'leaflet';
import type { Path } from 'leaflet';
import { mapAtom, districtsModeAtom, mapStatusAtom, loadingDistrictAtom } from './store';

const r2Path = process.env.NEXT_PUBLIC_R2_URL_PATH;

const modes = {
  none: 0,
  county: 1,
  village: 2,
};

async function getLayer(mode: number) {
  const url = `${r2Path}/geojson/${mode === modes.village ? 'villages' : 'counties'}.geojson`;
  const res = await fetch(url, {
    cache: 'force-cache',
    next: { revalidate: false }
  });
  const data = await res.json();
  return data;
}

const makeLayerOptions = (setName: any) => {
  return {
    style: () => ({
      fill: false,
    }),
    onEachFeature: function (feat: Feature, layer: Path) {
      layer.on('mouseover', function () {
        setName(feat.properties?.name);
        layer.setStyle({ fill: true });
      });
      layer.on('mouseout', function () {
        setName(null);
        layer.setStyle({ fill: false });
      });
    },
  };
}

export default function Districts() {
  const [mode, setMode] = useAtom(districtsModeAtom);
  const map = useAtomValue(mapAtom);
  const countyLayer = useRef<Leaflet.GeoJSON | null>(null);
  const villageLayer = useRef<Leaflet.GeoJSON | null>(null);
  const setLoading = useSetAtom(loadingDistrictAtom);
  const setStatus = useSetAtom(mapStatusAtom);

  const initCountyLayer = useCallback(async () => {
    setLoading(true);
    const data = await getLayer(modes.county)
    const options = makeLayerOptions(setStatus);
    countyLayer.current = Leaflet.geoJSON(data as GeoJsonObject, options);
    setLoading(false);
  }, [setStatus, setLoading]);

  const initVillageLayer = useCallback(async () => {
    setLoading(true);
    const data = await getLayer(modes.village)
    const options = makeLayerOptions(setStatus);
    villageLayer.current = Leaflet.geoJSON(data as GeoJsonObject, options);
    setLoading(false);
  }, [setStatus, setLoading]);

  const applyMode = useCallback(async (newMode: number) => {
    let layer;
    if (!map) return;

    switch (newMode) {
      case modes.county:
        if (!countyLayer.current) await initCountyLayer();
        layer = countyLayer.current;
        if (layer && !map.hasLayer(layer)) layer.addTo(map);
        villageLayer.current?.removeFrom(map);
        break;
      case modes.village:
        if (!villageLayer.current) await initVillageLayer();
        layer = villageLayer.current;
        if (layer && !map.hasLayer(layer)) layer.addTo(map);
        countyLayer.current?.removeFrom(map);
        break;
      default:
        countyLayer.current?.removeFrom(map);
        villageLayer.current?.removeFrom(map);
        break;
    }
  }, [map, initCountyLayer, initVillageLayer]);

  useEffect(() => {
    const apply = async () => {
      await applyMode(mode);
    };

    apply().catch((e) => {
      console.error(e);
      setLoading(false);
    });
  }, [mode, applyMode, setLoading]);

  return null;
}
