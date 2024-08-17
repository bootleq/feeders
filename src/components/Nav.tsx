"use client"

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useAtomValue } from 'jotai';
import type { WorldUserResult } from '@/models/users';
import { navTitleAtom } from '@/components/store';
import { UserIcon } from '@heroicons/react/24/outline';
import { IdentificationIcon } from '@heroicons/react/24/solid';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';

const menuItemCls = `p-2 w-full flex items-center`;

export default function Nav({ user }: {
  user: WorldUserResult | null,
}) {
  const title = useAtomValue(navTitleAtom);
  const { data: session, status } = useSession();
  const guestIconCls = 'stroke-white bg-slate-300';
  const userIconCls = [
    'ml-1 mr-2 size-5 rounded-full',
    'data-[state=open]:stroke-2 data-[state=open]:bg-slate-300/75 data-[state=open]:animate-pulse',
    status === 'authenticated' ? '' : guestIconCls,
  ].join(' ');

  return (
    <div className='absolute bottom-0 z-[1001] mt-auto py-1 w-full flex flex-wrap items-center backdrop-blur-sm'>
      <Tooltip>
        <TooltipTrigger>
          <UserIcon className={userIconCls} height={24} />
        </TooltipTrigger>
        <TooltipContent className="p-1 px-2 rounded box-border w-max max-w-[100vw-10px] z-[1002]">
          <div className={`flex flex-col divide-y w-full items-center justify-between lg:flex rounded bg-gradient-to-br from-stone-50 to-slate-100 ring-2 ring-offset-1 ring-slate-300`}>
            { status === 'authenticated' ?
              <>
                <div className={`text-xs ${menuItemCls}`}>
                  {user ?
                    <>
                      {user.name || session.userId}
                      <Tooltip>
                        <TooltipTrigger>
                          <Link href={`/user/${user.id}`} className='break-keep w-min cursor-pointer'>
                            <IdentificationIcon className='fill-slate-600 ml-1' height={24} />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent className="p-1 px-2 rounded box-border w-max bg-slate-100 ring-1 ring-slate-300 z-[1002]">前往個人資料頁</TooltipContent>
                      </Tooltip>
                    </>
                    :
                    <div>異常：沒有使用者資料</div>
                  }
                </div>
                <button className={menuItemCls} onClick={async () => await signOut()}>登出</button>
              </>
              :
              <>
                <Link href='/user/login' className={menuItemCls}>註冊或登入</Link>
                <button className={menuItemCls} onClick={() => signIn('google')}>直接以 Google 帳號登入</button>
              </>
            }
          </div>
        </TooltipContent>
      </Tooltip>

      <span className=''>{ title }</span>
    </div>
  );
};
