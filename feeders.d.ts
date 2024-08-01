import 'leaflet';

declare module 'leaflet' {
  interface Map {
    resetViewControl?: any;
    locateControl?: any;
  }
}
