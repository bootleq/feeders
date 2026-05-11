"use client"

import dynamic from 'next/dynamic';

const LazyMap = dynamic(() => import("./SimpleMap"), {
  ssr: false,
  loading: () => <p className='p-3 text-slate-700'>Loading...</p>,
});

export default LazyMap;
