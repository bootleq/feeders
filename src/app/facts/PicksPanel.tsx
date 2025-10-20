"use client"

import { useAtom, useSetAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { useEffect, useCallback } from 'react';
import { picksModeAtom, pickSavedAtom } from './store';
import type { PicksMode } from '@/app/facts/store';
import { XMarkIcon } from '@heroicons/react/24/solid';

const sectionCls = [
  'bg-slate-100 px-0 py-2 ring ring-[5px] rounded shadow-[10px_20px_20px_14px_rgba(0,0,0,0.5)]',
  'flex flex-col',
  'relative top-0 overflow-hidden w-full h-hull max-h-full lg:min-w-80',
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

  const onClose = useCallback(() => {
    setPicksMode('');
  }, [setPicksMode]);

  useEffect(() => {
    if (picksMode !== 'my') {
      setSaved(false);
    }
  }, [picksMode, setSaved]);

  if (!opened) {
    return null;
  }

  const privateRingStyle = mode === 'my' ? 'ring-purple-600/50 ring-offset-1' : '';

  return (
    <div className='fixed z-[900] inset-x-1/2 top-1 md:top-[4vh] -translate-x-1/2 w-max h-max max-w-[98vw] lg:min-w-[30vw] max-h-[88vh] flex flex-col-reverse items-center gap-y-1'>
      <XMarkIcon className='absolute z-[901] right-2 top-1.5 ml-auto cursor-pointer fill-slate-500 hover:fill-black' onClick={onClose} height={24} />
      <section className={`${sectionCls} ${privateRingStyle}`}>
        {children}
      </section>
    </div>
  );
};
