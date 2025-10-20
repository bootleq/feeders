"use client"

import { useAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { useCallback } from 'react';
import { picksModeAtom } from './store';
import type { PicksMode } from './store';
import PickForm from './PickForm';
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
  'bg-slate-100/95 px-3 py-2 overflow-scroll scrollbar-thin ring ring-[6px] rounded shadow-[10px_20px_20px_14px_rgba(0,0,0,0.5)]',
  'ring-offset-1 ring-purple-600/50',
  'lg:min-w-80',
].join(' ')

export default function PickFormPanel({ mode }: {
  mode: PicksMode,
}) {
  useHydrateAtoms([
    [picksModeAtom, mode],
  ]);

  const [picksMode, setPicksMode] = useAtom(picksModeAtom);
  const onClose = useCallback(() => setPicksMode(''), [setPicksMode]);

  if (picksMode !== 'edit') {
    return;
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className='fixed z-[900] inset-x-1/2 top-1 md:top-[20vh] -translate-x-1/2 w-max h-max max-w-[98vw] max-h-[80vh] flex flex-col-reverse items-center gap-y-1'>
        <AnimatePresence>
          <m.section className={sectionCls} {...motionProps}>
            <XMarkIcon className='absolute right-2 top-1.5 ml-auto cursor-pointer fill-slate-500' onClick={onClose} height={24} />
            <PickForm />
          </m.section>
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
};
