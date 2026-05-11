"use client"

import Link from 'next/link';
import { useAtom } from 'jotai';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'motion/react';
import { toggleShotIntroAtom } from './store';
import mapStyles from '@/components/map/map.module.scss';
import { XMarkIcon } from '@heroicons/react/24/solid';

const motionProps = {
  initial: { y: '-200%' },
  animate: { y: 0 },
  exit: {
    opacity: 0,
    y: '-200%',
    transition: { duration: .2 },
  },
};

const sectionCls = [
  'bg-slate-100/95 px-3 py-2 overflow-scroll scrollbar-thin ring ring-3 ring-offset-1 rounded shadow-[10px_20px_20px_14px_rgba(0,0,0,0.5)]',
  mapStyles.help,
].join(' ')

export default function ShotInstruction() {
  const [showIntro, toggle] = useAtom(toggleShotIntroAtom);

  return (
    <LazyMotion features={domAnimation}>
      <div className='fixed z-[900] inset-x-1/2 top-1 md:top-[20vh] -translate-x-1/2 w-max h-max max-w-[98vw] max-h-[80vh] flex flex-col-reverse items-center gap-y-1'>
        <AnimatePresence>
          { showIntro &&
            <m.section className={sectionCls} {...motionProps}>
              <XMarkIcon className='absolute right-1 top-1 ml-auto cursor-pointer fill-slate-500' onClick={toggle} height={24} />
              <h2 className='text-lg font-bold'>
                從照片新增地點
              </h2>
              <div className='text-base pt-3 pb-4'>
                <p>
                  您可以上傳照片，取得其中的 GPS 座標作為起點。
                </p>
                <p className='mt-3'>
                  請前往 →
                  <Link href='/world/shot/' className='font-mono p-1 mx-1 bg-yellow-200 underline'>
                    /world/shot/
                  </Link>
                  （會離開目前頁面）
                </p>
              </div>
            </m.section>
          }
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
};
