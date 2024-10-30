import { LatLng } from 'leaflet';

export const AREA_ZOOM_MAX = 12;
export const GEOHASH_PRECISION = 4;

const atRegexp = /\/@([\d.]+),([\d.]+)/g;

export function parsePath(pathname: string) {
  const result: {
    lat: number | null,
    lon: number | null,
    mode: string | null,
  } = { lat: null, lon: null, mode: null };

  let s = pathname.slice('/world'.length);

  if (s.match(/^\/area/)) {
    s = s.replace(/^\/area/, '');
    result.mode = 'area';
  } else {
    result.mode = 'world';
  }
  const at = [...s.matchAll(atRegexp)];
  if (at[0]) {
    result.lat = Number(at[0][1]);
    result.lon = Number(at[0][2]);
  }

  return result;
}

export function updatePath(params: {
  newZoom?: number
  newCenter?: LatLng
}) {
  const { newCenter, newZoom } = params;
  const { pathname, search } = window.location;
  let newPath = pathname;

  if (newCenter) {
    newPath = newPath.replaceAll(atRegexp, '');
    newPath = newPath.replace(/\/$/, '') + `/@${newCenter.lat},${newCenter.lng}`;
  }

  if (newZoom) {
    if (newZoom >= AREA_ZOOM_MAX) {
      newPath = newPath.replace(/^\/world\/(?!area\/)/, '/world/area/');
    } else {
      newPath = newPath.replace(/^\/world\/area\//, '/world/');
    }
  }

  window.history.replaceState(null, '', newPath + search);
}

export function visitArea(lat: number, lon: number) {
  return () => {
    window.history.pushState(null, '', `/world/area/@${lat},${lon}`);
  }
}
