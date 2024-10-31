"use client"

import { useAtom } from 'jotai';
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { toggleHelpAtom } from './store';
import mapStyles from '@/components/map.module.scss';
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

export default function Help(params: {
  content: React.ReactNode;
}) {
  const [showHelp, toggle] = useAtom(toggleHelpAtom);

  return (
    <LazyMotion features={domAnimation}>
      <div className='fixed z-[900] inset-x-1/2 top-1 md:top-[20vh] -translate-x-1/2 w-max h-max max-w-[98vw] max-h-[80vh] flex flex-col-reverse items-center gap-y-1'>
        <AnimatePresence>
          { showHelp &&
            <m.section className={sectionCls} {...motionProps}>
              <XMarkIcon className='absolute right-1 top-1 ml-auto cursor-pointer fill-slate-500' onClick={toggle} height={24} />
              <h2 className='text-lg font-bold'>
                怎麼使用？
              </h2>
              <div className='text-base pt-2 pb-3'>
                {params.content}
              </div>
            </m.section>
          }
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
};
