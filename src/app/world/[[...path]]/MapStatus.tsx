"use client"

import { useAtomValue } from 'jotai';
import { mapStatusAtom } from './store';

export default function MapStatus(params: any) {
  const status = useAtomValue(mapStatusAtom);

  if (!status) {
    return;
  }

  return (
    <div className='fixed flex flex-col items-end bottom-[20px] right-[54px] z-[401]'>
      <div className='p-2 rounded opacity-80 text-3xl font-bold [text-shadow:_0_1px_0_rgb(0_0_0_/_40%)]'>
        {status}
      </div>
    </div>
  );
}
