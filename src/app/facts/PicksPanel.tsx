"use client"

import { useAtom, useSetAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { useState, useEffect, useCallback, useRef } from 'react';
import { LazyMotion, m, useDragControls } from 'motion/react';
import { Tooltip, TooltipTrigger, TooltipContentMenu, menuHoverProps } from '@/components/Tooltip';
import { picksModeAtom, pickSavedAtom } from './store';
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
  'flex items-center p-1 px-4 mr-2 text-sm text-nowrap opacity-0 rounded',
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
    right: {
      top: 0,
      left: '',
      right: 0,
      x: 0,
      y: 0,
      height: '100vh',
      maxHeight: '100vh',
    },
    min: {
      top: '5vh',
      left: '',
      right: '2vw',
      x: 0,
      y: 0,
      overflow: 'hidden',
      width: '80px',
      height: '60px',
    },
  },
};

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

  return (
    <LazyMotion strict features={loadMotionFeatures}>
      <m.div {...motionProps} drag={canDrag} animate={layout} onAnimationComplete={onAnimateEnd} dragControls={controls} dragConstraints={viewportRef} className={containerCls} style={minDimensionStyle}>
        <div className='absolute z-[901] right-2 top-1.5 ml-auto flex items-center gap-x-2'>
          {canDrag &&
            <div className={draggerCls} onPointerDown={startDrag} style={{ touchAction: 'none' }}>
              拖曳這裡
              <MoveIcon className='mx-1 inline group-active:stroke-black' width={18} height={18} aria-label='move' />
              移動位置
            </div>
          }
          <Tooltip placement='top-start' hoverProps={menuHoverProps} role='menu'>
            <TooltipTrigger className=''>
              <button type='button' className={`text-slate-600 ${minimized ? '' : 'hover:text-black bg-slate-100'}`} aria-label='顯示方式'>
                {minimized ?
                  <div className='flex text-lg items-center gap-x-1'>
                    <LibraryBigIcon height={22} />
                    選集
                  </div>
                  :
                  <Bars3Icon height={20} />
                }
              </button>
            </TooltipTrigger>
            <TooltipContentMenu className={tooltipClass('text-sm drop-shadow-md')}>
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
      </m.div>
    </LazyMotion>
  );
};
