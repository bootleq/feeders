export const TW_BOUNDS = [
  [21.7, 118.5], // bottom left
  [25.4, 122.3]  // up right
];

export const TW_CENTER = [23.9739, 120.9773];

export const GEOHASH_PRECISION = 4;

export const googleMapURL = (lat: number, lon: number) => {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}
