"use client"

import * as R from 'ramda';
import { useAtom, useSetAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { useState, useEffect, useCallback, useRef } from 'react';
import { LazyMotion, m, useDragControls } from 'motion/react';
import { Tooltip, TooltipTrigger, TooltipContentMenu, menuHoverProps } from '@/components/Tooltip';
import { picksModeAtom, pickSavedAtom } from './store';
import PickDisplayMenu from './PickDisplayMenu';
import { tooltipClass, tooltipMenuCls } from '@/lib/utils';
import type { PicksMode } from '@/app/facts/store';
import { XMarkIcon, Bars3Icon, MinusIcon } from '@heroicons/react/24/solid';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import DotIcon from '@/assets/dot.svg';
import MoveIcon from '@/assets/move.svg';
import LibraryBigIcon from '@/assets/library-big.svg';

const loadMotionFeatures = () =>
  import('@/lib/motion-features').then(res => res.default);

type Layout = 'init' | 'right' | 'min';

const minDimension = {
  'init': { w: '30vw', h: '10vh' },
  'right': { w: '20vw', h: '100vh' },
  'min': { w: 0, h: 0 },
};

const containerCls = [
  'fixed z-[900] w-max h-max max-w-[98vw]',
  'flex flex-col items-center gap-y-1',
  'mx-auto',
  '[--motion-top:0.25rem] md:[--motion-top:4vh]'
].join(' ');

const draggerCls = [
  'hidden md:flex',
  'items-center p-1 px-4 mr-2 text-sm text-nowrap opacity-0 rounded',
  'select-none cursor-grab group',
  'hover:bg-white hover:ring-1 hover:opacity-100',
  'active:text-white active:ring-2 active:ring-yellow-300 active:cursor-grabbing',
].join(' ');

const layoutBtnCls = 'p-2 w-full cursor-pointer flex items-center gap-1 rounded hover:bg-amber-200 disabled:opacity-50 disabled:cursor-default';

const motionProps = {
  dragMomentum: false,
  dragListener: false,
  initial: 'init',
  variants: {
    init: {
      left: 0,
      right: 0,
      top: 'var(--motion-top)',
      height: 'auto',
      maxHeight: '88vh',
    },
    right: ({ rightSpace }: {
      rightSpace?: number,
    }) => ({
      top: 0,
      left: '',
      right: 0,
      x: 0,
      y: 0,
      height: '100vh',
      maxHeight: '100vh',
      ...(rightSpace ? { width: rightSpace } : {}),
    }),
    min: {
      top: '5vh',
      left: '',
      right: '2vw',
      x: 0,
      y: 0,
      overflow: 'hidden',
      width: '90px',
      height: '80px',
    },
  },
};

function MinimizedButton({ className }: {
  className?: string
}) {
  return (
    <div className={`flex text-lg items-center gap-x-1 w-fit p-2 rounded-full bg-white ring-1 ring-slate-300 ${className}`}>
      <LibraryBigIcon height={22} />
      選集
    </div>
  );
}

const sectionCls = [
  'bg-slate-100 px-0 py-2 ring ring-[5px] rounded shadow-[10px_20px_20px_14px_rgba(0,0,0,0.5)]',
  'flex flex-col flex-grow resize',
  'relative top-0 overflow-hidden w-full h-hull max-w-[98vw] max-h-full',
].join(' ')

export default function PicksPanel({ mode, children }: {
  mode: PicksMode,
  children?: React.ReactNode,
}) {
  useHydrateAtoms([
    [picksModeAtom, mode],
  ]);
  const [picksMode, setPicksMode] = useAtom(picksModeAtom);
  const opened = ['index', 'item', 'my'].includes(picksMode);
  const setSaved = useSetAtom(pickSavedAtom);

  const [layout, setLayout] = useState<Layout>('init');
  const [minimized, setMinimized] = useState(false);
  const [rightSpace, setRightSpace] = useState<number>(0);
  const [canDrag, setCanDrag] = useState(true);
  const viewportRef = useRef<HTMLBodyElement|null>(null);
  const controls = useDragControls();

  const startDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    controls.start(e, { snapToCursor: false });
  }, [controls]);

  const onAnimateEnd = useCallback((latest: any) => {
    if (latest === 'init') {
      setCanDrag(true);
    }
    setMinimized(latest === 'min');
  }, []);

  const onClose = useCallback(() => {
    setPicksMode('');
  }, [setPicksMode]);

  const onSwitchLayout = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const to = String(e.currentTarget?.dataset.layout);
    if (['init', 'right', 'min'].includes(to)) {
      if (to !== 'init') {
        setCanDrag(false);
      }
      if (to !== 'min') {
        setMinimized(false);
      }
      if (to === 'right') {
        const $tl = Array.from(document.querySelectorAll('div[data-role="timeline"]')).pop();
        const rightFree = $tl?.getBoundingClientRect()?.right;
        if (rightFree && rightFree < window.innerWidth) {
          setRightSpace(window.innerWidth - rightFree);
        } else {
          setRightSpace(0);
        }
      }
      setLayout(to as Layout);
    }
  }, []);

  useEffect(() => {
    if (picksMode !== 'my') {
      setSaved(false);
    }
  }, [picksMode, setSaved]);

  useEffect(() => {
    viewportRef.current = document.querySelector('body');
  }, []);

  if (!opened) {
    return null;
  }

  const privateRingStyle = mode === 'my' ? 'ring-purple-600/50 ring-offset-1' : '';
  const minDimensionStyle = { minWidth: minDimension[layout].w, minHeight: minDimension[layout].h };
  const custom = {
    rightSpace: rightSpace > 0 ? R.min(rightSpace, 600) : {},
  };

  return (
    <LazyMotion strict features={loadMotionFeatures}>
      <m.div {...motionProps} custom={custom} drag={canDrag} animate={layout} onAnimationComplete={onAnimateEnd} dragControls={controls} dragConstraints={viewportRef} className={containerCls} style={minDimensionStyle}>
        <div className='absolute z-[901] right-2 top-1.5 ml-auto flex items-center gap-x-2'>
          {canDrag &&
            <div className={draggerCls} onPointerDown={startDrag} style={{ touchAction: 'none' }}>
              拖曳這裡
              <MoveIcon className='mx-1 inline group-active:stroke-black' width={18} height={18} aria-label='move' />
              移動位置
            </div>
          }

          {minimized &&
            <button data-layout={'init'} type='button' className='md:hidden z-[902]' onClick={onSwitchLayout}>
              <MinimizedButton className='shadow-xl' />
            </button>
          }

          <PickDisplayMenu className='mr-1' />

          <Tooltip placement='top-start' hoverProps={menuHoverProps} role='menu'>
            <TooltipTrigger className=''>
              <button type='button' className={`hidden md:block text-slate-600 ${minimized ? '' : 'hover:text-black bg-slate-100'}`} aria-label='顯示方式'>
                {minimized ?
                  <div className='flex text-lg items-center gap-x-1 p-2 rounded-full bg-white/75 md:bg-transparent'>
                    <LibraryBigIcon height={22} />
                    選集
                  </div>
                  :
                  <Bars3Icon height={20} />
                }
              </button>
            </TooltipTrigger>
            <TooltipContentMenu className={tooltipClass('text-sm drop-shadow-md')} dismissOnClick>
              <div className={tooltipMenuCls()}>
                <button data-layout={'init'} type='button' className={layoutBtnCls} onClick={onSwitchLayout} disabled={layout === 'init'}>
                  <DotIcon width={20} height={20} className='' />
                  置中
                </button>
                <button data-layout={'right'} type='button' className={layoutBtnCls} onClick={onSwitchLayout} disabled={layout === 'right'}>
                  <ChevronRightIcon height={20} className='' />
                  停駐至右側
                </button>
                <button data-layout={'min'} type='button' className={layoutBtnCls} onClick={onSwitchLayout} disabled={layout === 'min'}>
                  <MinusIcon height={20} className='' />
                  最小化
                </button>
              </div>
            </TooltipContentMenu>
          </Tooltip>

          {layout !== 'min' &&
            <XMarkIcon className='cursor-pointer fill-slate-500 hover:fill-black' onClick={onClose} height={24} />
          }
        </div>

        {!minimized &&
          <section className={`${sectionCls} ${privateRingStyle}`} style={minDimensionStyle}>
            {children}
          </section>
        }

        {!minimized &&
          <button data-layout={'min'} type='button' onClick={onSwitchLayout}
            className='md:hidden flex flex-col w-max items-center gap-y-2 translate-y-4 p-3 px-5 text-slate-900 bg-gradient-to-br from-stone-50 to-stone-200 ring-4 ring-stone-400 rounded-2xl shadow-2xl z-[902]'
          >
            <div className=''>
              點這裡開始看<br />
              <strong>事實</strong>時間軸
            </div>
            <div className='flex items-center gap-x-1'>
              要返回時再按
              <MinimizedButton className='animate-pulse' />
            </div>
          </button>
        }
      </m.div>
    </LazyMotion>
  );
};
