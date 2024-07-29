"use client"

import { useAtomValue } from 'jotai';
import { worldCtrlAtom } from './store';
import { HandThumbDownIcon } from '@heroicons/react/24/solid';

export default function Nav({}: {
}) {
  const worldCtrl = useAtomValue(worldCtrlAtom);
  const { mode } = worldCtrl;

  return (
    <div className='mt-auto flex flex-wrap items-center'>
      <HandThumbDownIcon className='ml-1 mr-2 fill-current size-7' height={24} />
      <span>
        { mode === 'world' ? '世界地圖' : '區域地圖' }
      </span>
    </div>
  );
};
