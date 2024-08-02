import { useSetAtom, useAtomValue } from 'jotai';
import type { PrimitiveAtom, WritableAtom } from 'jotai';
import { ReactElement } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/solid';

type keyedAlert = [string, ReactElement];

export default function ALert(params: {
  itemsAtom: PrimitiveAtom<keyedAlert[]>,
  dismissAtom: WritableAtom<null, [key: string], void>,
}) {
  const items = useAtomValue(params.itemsAtom);
  const dismissError = useSetAtom(params.dismissAtom);

  const motionProps = {
    initial: { y: '-200%' },
    animate: { y: 0 },
    exit: {
      opacity: 0,
      x: '300%',
      transition: { duration: .2 },
    },
  };
  const cls = [
    'flex items-center',
    'w-max h-max px-6 py-4 shadow-[10px_20px_20px_14px_rgba(0,0,0,0.5)]',
    'text-lg bg-pink-300/20 backdrop-blur-sm ring ring-3 ring-offset-1 ring-slate-500 rounded',
  ].join(' ');

  const Error = (error: keyedAlert) => {
    const [eKey, eNode] = error;
    return (
        <m.div key={eKey} className={`${cls} bg-red ring-black my-3 py-9 px-9`} {...motionProps}>
          <ExclamationCircleIcon className='mr-1 fill-white stroke-red-700 stroke-2' height={32} />
          錯誤：{eNode}
          <XMarkIcon className='absolute right-1 top-1 ml-auto cursor-pointer fill-slate-500' onClick={() => dismissError(eKey)} height={24} />
        </m.div>
    );
  };

  return (
    <LazyMotion features={domAnimation}>
      <div className='fixed z-[900] inset-x-1/2 top-[40vh] -translate-x-1/2 w-max h-max flex flex-col-reverse gap-y-1'>
        <AnimatePresence>
        {items.map(e => Error(e))}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}
