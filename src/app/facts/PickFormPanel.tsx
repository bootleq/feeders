"use client"

import { useAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { LazyMotion, m, AnimatePresence, useDragControls } from 'motion/react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { picksModeAtom } from './store';
import type { PicksMode } from './store';
import PickForm from './PickForm';
import { XMarkIcon } from '@heroicons/react/24/solid';
import MoveIcon from '@/assets/move.svg';

const loadMotionFeatures = () =>
  import('@/lib/motion-features').then(res => res.default);

const motionProps = {
  dragMomentum: false,
  dragListener: false,
  initial: 'init',
  animate: 'normal',
  exit: 'exit',
  variants: {
    init: {
      left: 0,
      right: 0,
      y: '-200%',
    },
    normal: {
      x: 0,
      y: 0,
      top: 'var(--motion-top)',
    },
    exit: {
      opacity: 0,
      y: '-200%',
      transition: { duration: .2 },
    },
  },
};

const containerCls = [
  'fixed z-[900] w-max h-max max-w-[98vw] max-h-[90vh]',
  'flex flex-col items-center gap-y-1',
  'mx-auto',
  '[--motion-top:0.25rem] md:[--motion-top:4vh]'
].join(' ');

const sectionCls = [
  'bg-slate-100/95 px-3 py-2 scrollbar-thin ring ring-[6px] rounded shadow-[10px_20px_20px_14px_rgba(0,0,0,0.5)]',
  'ring-offset-1 ring-purple-600/50',
  'overflow-scroll resize',
  'md:min-w-[540px] min-h-96 max-w-full max-h-screen',
].join(' ')

const draggerCls = [
  'hidden md:flex',
  'items-center p-1 px-4 mr-2 text-sm text-nowrap opacity-0 rounded',
  'select-none cursor-grab group',
  'hover:bg-white hover:ring-1 hover:opacity-100',
  'active:text-white active:ring-2 active:ring-yellow-300 active:cursor-grabbing',
].join(' ');

export default function PickFormPanel({ mode }: {
  mode: PicksMode,
}) {
  useHydrateAtoms([
    [picksModeAtom, mode],
  ]);

  const [picksMode, setPicksMode] = useAtom(picksModeAtom);
  const onClose = useCallback(() => setPicksMode(''), [setPicksMode]);

  const viewportRef = useRef<HTMLBodyElement|null>(null);
  const [canDrag, setCanDrag] = useState(false);
  const controls = useDragControls();

  const startDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    controls.start(e, { snapToCursor: false });
  }, [controls]);

  const onAnimateEnd = useCallback((latest: any) => {
    setCanDrag(latest === 'normal');
  }, []);

  useEffect(() => {
    viewportRef.current = document.querySelector('body');
  }, []);

  return (
    <LazyMotion strict features={loadMotionFeatures}>
      <AnimatePresence>
        {picksMode === 'edit' &&
          <m.div drag={canDrag} dragControls={controls} dragConstraints={viewportRef} onAnimationComplete={onAnimateEnd} {...motionProps} className={containerCls}>
            <section className={sectionCls}>
              <div className='absolute right-2 top-1.5 flex items-center'>
                <div className={draggerCls} onPointerDown={startDrag} style={{ touchAction: 'none' }}>
                  拖曳這裡
                  <MoveIcon className='mx-1 inline group-active:stroke-black' width={18} height={18} aria-label='move' />
                  移動位置
                </div>
                <XMarkIcon className='ml-auto cursor-pointer fill-slate-500' onClick={onClose} height={24} />
              </div>
              <PickForm />
            </section>
          </m.div>
        }
      </AnimatePresence>
    </LazyMotion>
  );
};
