"use client"

import { useSession, signIn, signOut } from 'next-auth/react';
import { userAtom } from './store';
import type { WorldUserResult } from '@/models/spots';
import { useHydrateAtoms } from 'jotai/utils';
// import { HandThumbDownIcon } from '@heroicons/react/24/solid';
import { UserIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';

const menuItemCls = `p-2 w-full`;

export default function Nav({ user }: {
  user: WorldUserResult | null,
}) {
  useHydrateAtoms([
    [userAtom, user],
  ]);
  const pathname = usePathname();
  const mode = pathname.startsWith('/world/area') ? 'area' : 'world';
  const { data: session, status } = useSession();
  const guestIconCls = 'stroke-white bg-slate-300';
  const userIconCls = [
    'ml-1 mr-2 size-5 rounded-full',
    'data-[state=open]:stroke-2 data-[state=open]:bg-slate-300/75 data-[state=open]:animate-pulse',
    status === 'authenticated' ? '' : guestIconCls,
  ].join(' ');

  return (
    <div className='absolute bottom-0 z-[1001] mt-auto w-full flex flex-wrap items-center backdrop-blur-sm'>
      <Tooltip>
        <TooltipTrigger>
          <UserIcon className={userIconCls} height={24} />
        </TooltipTrigger>
        <TooltipContent className="p-1 px-2 rounded box-border w-max max-w-[100vw-10px] z-[1002]">
          <div className={`flex flex-col divide-y w-full items-center justify-between lg:flex rounded bg-gradient-to-br from-stone-50 to-slate-100 ring-2 ring-offset-1 ring-slate-300`}>
            { status === 'authenticated' ?
              <>
                <div className={`text-xs ${menuItemCls}`}>{session.userId} </div>
                <button className={menuItemCls} onClick={async () => await signOut()}>登出</button>
              </> :
              <button className={menuItemCls} onClick={() => signIn('google')}>以 Google 帳號登入</button>
            }
          </div>
        </TooltipContent>
      </Tooltip>

      <span className=''>
        { mode === 'world' ? '世界地圖' : '區域地圖' }
      </span>
    </div>
  );
};