"use client"

import Leaflet from 'leaflet';
// import * as ReactLeaflet from 'react-leaflet';
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import 'leaflet/dist/leaflet.css';
// import "leaflet-defaulticon-compatibility";
// import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
// import Image from "next/image";
import styles from './Map.module.scss';

type MapProps = {
  children?: React.ReactNode;
  className?: string;
  width?: string | number;
  height?: string | number;
  [key: string]: any;
};

function MapUser() {
  const map = useMap();
  console.log('map center:', map.getCenter());
  return null;
}

export default function Map({ children, className, width, height, ...rest }: MapProps) {
  // useEffect(() => {
  //   (async function init() {
  //     delete Leaflet.Icon.Default.prototype._getIconUrl;
  //     Leaflet.Icon.Default.mergeOptions({
  //       iconRetinaUrl: 'leaflet/images/marker-icon-2x.png',
  //       iconUrl: 'leaflet/images/marker-icon.png',
  //       shadowUrl: 'leaflet/images/marker-shadow.png',
  //     });
  //   })();
  // }, []);

  return (
    <MapContainer className={styles.map} {...rest}>
      <MapUser />
      <TileLayer
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
      >
      </TileLayer>
    </MapContainer>
  );
}
