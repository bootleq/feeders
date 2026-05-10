import * as R from 'ramda';
import type { Metadata } from "next";
import { TW_BOUNDS } from '@/app/world/mapUtil';
import Sidebar from '@/components/Sidebar';
import LinkPreview from '@/components/LinkPreview';
import getGeoHashes from '@/components/map/getGeoHashes';
import PhotoReader from './PhotoReader';
import LazyMap from './LazyMap';

import '@/components/leaflet/leaflet.css';  // import CSS here instead of inside SimpleMap for stability

export const metadata: Metadata = {
  title: '從照片新增地點',
  description: '從照片取得地理資訊，新增餵食點，登陸到 Feeders 世界地圖',
};

export default async function Page() {
  const geohashes = await getGeoHashes();

  return (
    <main className="flex min-h-screen flex-row items-start justify-between">
      <Sidebar defaultOpen fixed={false} className={`sm:w-fit lg:w-fit lg:max-w-[80%] max-h-screen scrollbar-thin flex flex-col pb-1 z-[810] bg-gradient-to-br from-stone-50 to-slate-200`}>
        <PhotoReader />
      </Sidebar>

      <div className='relative w-full h-[100vh] ml-auto'>
        <LazyMap
          allGeoHashes={geohashes}
          preferCanvas={true}
          minZoom={15}
          zoom={18}
          maxZoom={20}
          maxBounds={TW_BOUNDS}
          maxBoundsViscosity={0.5}
          zoomControl={false}
        >
        </LazyMap>
      </div>

      <LinkPreview />
    </main>
  );
}
