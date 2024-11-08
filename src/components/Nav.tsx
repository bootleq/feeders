"use client"

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useAtomValue } from 'jotai';
import { safePolygon } from "@floating-ui/react";
import Sitemap from '@/components/Sitemap';
import { navTitleAtom } from '@/components/store';
import siteIcon from '@/app/icon.svg'
import { HomeIcon } from '@heroicons/react/24/outline';
import { UserIcon } from '@heroicons/react/24/outline';
import { IdentificationIcon } from '@heroicons/react/24/solid';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';

const menuItemCls = `p-2 w-full flex items-center`;

const hoverProps = {
  delay: { open: 0, close: 240 },
  handleClose: safePolygon(),
};

function NavMenu({ className, userDisplay, userLink }: {
  className?: string,
  userDisplay: string,
  userLink: string,
}) {
  const cls = [
    'flex flex-col divide-y',
    'w-[clamp(100%,80vw,280px)]',
    'lg:flex items-center justify-between rounded bg-gradient-to-br from-stone-50 to-slate-100 ring-2 ring-offset-1 ring-slate-300',
  ].join(' ');

  return (
    <div className={cls}>
      <Link href='/' className='w-full p-2 flex items-center justify-center'>
        <HomeIcon className='stroke-slate-500 mr-1.5 -mt-[2px]' height={19} />
        首頁
      </Link>
      <Sitemap userDisplay={userDisplay} userLink={userLink} />
    </div>
  );
}

export default function Nav() {
  const title = useAtomValue(navTitleAtom);
  const { data: session, status } = useSession();
  const guestIconCls = 'stroke-white bg-slate-300';
  const userIconCls = [
    'ml-1 mr-2 size-5 rounded-full',
    'data-[state=open]:stroke-2 data-[state=open]:bg-slate-300/75 data-[state=open]:animate-pulse',
    status === 'authenticated' ? '' : guestIconCls,
  ].join(' ');

  const userDisplay = status === 'loading' ? ''  : session?.user?.name || '登入';
  const userLink = status === 'authenticated' ? `/user/${session.userId}` : '/user/login';

  return (
    <div className='absolute bottom-0 z-[1001] mt-auto py-1 w-full flex flex-wrap items-center backdrop-blur-sm'>
      <Tooltip>
        <TooltipTrigger>
          <UserIcon className={userIconCls} height={24} />
        </TooltipTrigger>
        <TooltipContent className="p-1 px-2 rounded box-border w-max max-w-[calc(100vw_-_10px)] z-[1002]">
          <div className={`flex flex-col divide-y w-full items-center justify-between lg:flex rounded bg-gradient-to-br from-stone-50 to-slate-100 ring-2 ring-offset-1 ring-slate-300`}>
            { status === 'authenticated' ?
              <>
                <div className={`text-xs ${menuItemCls}`}>
                  {userDisplay || session.userId}
                  <Tooltip>
                    <TooltipTrigger>
                      <Link href={`/user/${session.userId}`} className='break-keep w-min cursor-pointer'>
                        <IdentificationIcon className='fill-slate-600 ml-1' height={24} />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent className="p-1 px-2 rounded box-border w-max bg-slate-100 ring-1 ring-slate-300 z-[1002]">前往個人資料頁</TooltipContent>
                  </Tooltip>
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

      <Tooltip hoverProps={hoverProps}>
        <TooltipTrigger className='flex items-center'>
          <span className=''>{ title }</span>
          <Image src={siteIcon} alt='導覽' className='ml-1.5 -translate-y-[0.175rem] opacity-60' width={22} height={22} />
        </TooltipTrigger>
        <TooltipContent className="p-1 px-2 rounded box-border w-max max-w-[calc(100vw_-_10px)] z-[1002]">
          <NavMenu userDisplay={userDisplay} userLink={userLink} />
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
