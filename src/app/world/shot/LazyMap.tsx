"use client"

import dynamic from 'next/dynamic';

const LazyMap = dynamic(() => import("./SimpleMap"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

export default LazyMap;
