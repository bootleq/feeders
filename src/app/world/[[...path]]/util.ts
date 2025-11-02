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
  const oldHref = window.location.href;
  const newURL = new URL(oldHref);
  let newPath = newURL.pathname;

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

  newURL.pathname = newPath;
  const newHref = newURL.href;

  if (oldHref !== newHref) {
    window.history.replaceState(null, '', newHref);
  }
}

export function visitArea(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();

  const href = e.currentTarget.href;
  const newURL = new URL(href);
  const matches = href.match(/area\/@([\d\.]+),([\d\.]+)(#\d+)?\/?/);

  if (matches && matches.length >= 3) {
    const [, lat, lon, hash] = matches;
    newURL.pathname = `/world/area/@${lat},${lon}`;
    newURL.hash = hash || '';
    window.history.pushState(null, '', newURL.href);

    if (hash) {
      // re-trigger hashchange for Marker id following
      const hashChangeEvent = new HashChangeEvent('hashchange', {
        oldURL: href,
        newURL: newURL.href,
        bubbles: true,
      });
      window.dispatchEvent(hashChangeEvent);
    }
  } else {
    console.error('無法由連結解析位址');
  }
}

export function openSpotMarkerById(id: number, layer: any, timeout: number = 0) {
  let found = false;

  if (typeof layer.eachLayer === 'function' && typeof layer.zoomToShowLayer === 'function') { // is MarkerClusterGroup
    layer.eachLayer((sub: any) => {
      if (sub.options['spot-id'] === id) {
        found = true;
        setTimeout(() => {
          const openedPopup = document.querySelector('.leaflet-popup');
          if (!openedPopup) {
            layer.zoomToShowLayer(sub, () => {
              sub.openPopup();
            });
          }
        }, timeout);
      }
    });
  } else {
    if (layer.options['spot-id'] === id) {
      found = true;
      setTimeout(() => {
        const openedPopup = document.querySelector('.leaflet-popup');
        if (!openedPopup) {
          layer.openPopup();
        }
      }, timeout);
    }
  }
  return found;
}
