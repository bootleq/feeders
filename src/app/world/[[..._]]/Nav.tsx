"use client"

import { HandThumbDownIcon } from '@heroicons/react/24/solid';
import { usePathname } from 'next/navigation';

export default function Nav({}: {
}) {
  const pathname = usePathname();
  const mode = pathname.startsWith('/world/area') ? 'area' : 'world';

  // bg-gradient:  bg-gradient-to-r from-slate-170/25 to-slate-200
  return (
    <div className='absolute bottom-0 z-[1001] mt-auto w-full flex flex-wrap items-center'>
      <HandThumbDownIcon className='ml-1 mr-2 fill-current size-7' height={24} />
      <span>
        { mode === 'world' ? '世界地圖' : '區域地圖' }
      </span>
    </div>
  );
};
