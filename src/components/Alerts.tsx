"use client"

import { useSetAtom, useAtomValue } from 'jotai';
import type { PrimitiveAtom, WritableAtom } from 'jotai';
import { ReactElement } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/solid';

type keyedAlert = [string, 'info' | 'error', ReactElement];

const itemWrapperCls = [
  'flex flex-wrap items-center justify-center',
  '[white-space-collapse:preserve-spaces]',
  'w-max max-w-[90vw] h-max px-6 py-4 shadow-[10px_20px_20px_14px_rgba(0,0,0,0.5)]',
  'text-lg bg-pink-300/20 backdrop-blur-sm ring ring-3 ring-offset-1 rounded',
].join(' ');

const motionProps = {
  initial: { y: '-200%' },
  animate: { y: 0 },
  exit: {
    opacity: 0,
    x: '300%',
    transition: { duration: .2 },
  },
};

function ErrorItem(key: string, content: ReactElement, dismiss: (key: string) => void ) {
  return (
    <m.div key={key} role='alert' className={`${itemWrapperCls} bg-red ring-red-900/75 my-3 py-9 px-9`} {...motionProps}>
      <ExclamationCircleIcon className='mr-1 fill-white stroke-red-800 stroke-2' height={32} />
      錯誤：{content}
      <XMarkIcon role='button' aria-label='關閉' aria-hidden={false} className='absolute right-1 top-1 ml-auto cursor-pointer fill-slate-500' onClick={() => dismiss(key)} height={24} />
    </m.div>
  );
}

function InfoItem(key: string, content: ReactElement, dismiss: (key: string) => void ) {
  return (
    <m.div key={key} className={`${itemWrapperCls} bg-white/50 ring-yellow my-3 py-9 px-9`} {...motionProps}>
      {content}
      <XMarkIcon role='button' aria-label='關閉' aria-hidden={false} className='absolute right-1 top-1 ml-auto cursor-pointer fill-slate-500' onClick={() => dismiss(key)} height={24} />
    </m.div>
  );
}

export default function Alert(params: {
  itemsAtom: PrimitiveAtom<keyedAlert[]>,
  dismissAtom: WritableAtom<null, [key: string], void>,
}) {
  const items = useAtomValue(params.itemsAtom);
  const dismiss = useSetAtom(params.dismissAtom);

  return (
    <LazyMotion features={domAnimation}>
      <div className='fixed z-[900] inset-x-1/2 top-[40vh] -translate-x-1/2 w-max h-max flex flex-col-reverse items-center gap-y-1'>
        <AnimatePresence>
          {items.map(i => {
            const [key, type, content] = i;
            if (type === 'info') {
              return InfoItem(key, content, dismiss);
            } else {
              return ErrorItem(key, content, dismiss);
            }
          })}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}
