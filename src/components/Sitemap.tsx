"use client"

import Link from 'next/link';
import Image from 'next/image';
import styles from './sitemap.module.scss';
import { Tooltip, TooltipTrigger, TooltipContentMenu, menuHoverProps } from '@/components/Tooltip';

import TaiwanIcon from '@/assets/main-island.svg';
import JudgeIcon from '/public/assets/gavel.svg';
import ThinkIcon from '@/assets/brain-and-head.svg';
import HumanIcon from '@/assets/man-walk.svg';
import BarChartIcon from '@/assets/bar-chart.svg';
import { ListBulletIcon, ArrowTurnDownRightIcon } from '@heroicons/react/24/solid';

const iconSize = 32;

export default function Sitemap({ className, userDisplay, userLink }: {
  className?: string,
  userDisplay: string,
  userLink: string,
}) {
  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={`backdrop-blur-sm ${styles.map}`}>
        <div className={styles.body}>

          <div className={styles.user}>
            <Link href={userLink}>
              <HumanIcon className='fill-slate-700 scale-110 -mr-1.5' width={iconSize} height={iconSize} />
              <span className='truncate'>{userDisplay}</span>
            </Link>
          </div>

          <div className={styles.facts}>
            <Link href='/facts'>
              <ListBulletIcon className='fill-slate-700' width={iconSize} height={iconSize} />
              <span>事實</span>
            </Link>
          </div>

          <div className={styles.insights}>
            <Link href='/insights'>
              <ThinkIcon className='fill-slate-700 scale-[.8]' width={iconSize} height={iconSize} />
              <span>見解</span>
            </Link>
          </div>

          <div className={styles.laws}>
            <Link href='/laws'>
              <JudgeIcon className='fill-yellow-600' width={iconSize} height={iconSize} />
              <span>法規</span>
            </Link>
          </div>

          <div className={styles.charts}>
            <Link href='/charts'>
              <BarChartIcon className='scale-[75%] fill-[#5d77c9] -translate-y-px' width={iconSize} height={iconSize} />
              <span className=''>圖表</span>
            </Link>
          </div>

          <div className={styles.world}>
            <Link href='/world' className=''>
              <TaiwanIcon className='fill-lime-700 -mr-1.5' width={iconSize} height={iconSize} />
              <Tooltip placement='right' hoverProps={menuHoverProps} role='menu'  offset={{ crossAxis: 20 }}>
                <TooltipTrigger>
                  世界地圖
                </TooltipTrigger>
                <TooltipContentMenu>
                  <Link href='/world/shot/' className='flex items-center p-2 px-3 rounded-md text-slate-600 w-fit hover:text-black hover:bg-white hover:drop-shadow-md'>
                    <ArrowTurnDownRightIcon className='inline' width={11} height={11} />
                    <span className='ml-1 hover:underline decoration-yellow-300 decoration-4 underline-offset-3'>從照片</span>
                  </Link>
                </TooltipContentMenu>
              </Tooltip>
            </Link>
          </div>


        </div>
      </div>
    </div>
  );
}
