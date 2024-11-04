"use client"

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './sitemap.module.scss';

import TaiwanIcon from '@/assets/main-island.svg';
import JudgeIcon from '/public/assets/gavel.svg';
import ThinkIcon from '@/assets/brain-and-head.svg';
import HumanIcon from '@/assets/man-walk.svg';
import LightingIcon from '@/assets/lightning.svg';
import { ListBulletIcon } from '@heroicons/react/24/solid';

const iconSize = 32;

const disableCls = 'grayscale fill-gray-300';

export default function Sitemap({ className }: {
  className?: string,
}) {
  const { data: session, status } = useSession();
  let userLink = '/user/login';
  let userDisplay = '我';

  if (status === 'authenticated') {
    userLink = `/user/${session.userId}`;
    const name = session.user.name;
    if (name) {
      userDisplay = name;
    }
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={`backdrop-blur-sm ${styles.map}`}>
        <div className={styles.body}>

          <div className={styles.user}>
            <Link href={userLink}>
              <HumanIcon className='fill-slate-700 scale-110 -mr-1.5' width={iconSize} height={iconSize} />
              <span className='truncate'>{ status === 'authenticated' ? userDisplay : '登入' }</span>
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

          <div className={styles.actions}>
            <Link href='' className={`${styles.unreleased}`}>
              <LightingIcon className={ disableCls } width={iconSize} height={iconSize} />
              <span className='text-gray-300'>行動</span>
            </Link>
          </div>

          <div className={styles.world}>
            <Link href='/world' className=''>
              <TaiwanIcon className='fill-lime-700 -mr-1.5' width={iconSize} height={iconSize} />
              <span className=''>世界地圖</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
