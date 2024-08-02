"use client"

import User from '@/components/User';
// import { HandThumbDownIcon } from '@heroicons/react/24/solid';
import { UserIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';

export default function Nav({}: {
}) {
  const pathname = usePathname();
  const mode = pathname.startsWith('/world/area') ? 'area' : 'world';

  return (
    <div className='absolute bottom-0 z-[1001] mt-auto w-full flex flex-wrap items-center'>
      <UserIcon className='ml-1 mr-2 size-5' height={24} />

      <span className=''>
        { mode === 'world' ? '世界地圖' : '區域地圖' }
      </span>
    </div>
  );
};
