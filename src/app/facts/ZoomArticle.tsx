"use client"

import * as R from 'ramda';
import { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { present } from '@/lib/utils';
import { zoomedFactAtom } from './store';
import tlStyles from './timeline.module.scss';
import FactTagList from './FactTagList';
import Html from '@/components/Html';
import { XMarkIcon } from '@heroicons/react/24/outline';

const dialogCls = [
  'min-w-[40vw] min-h-[40vh] pb-3 rounded drop-shadow-md',
  'max-w-full lg:max-w-screen-lg xl:max-w-screen-xl',
  'bg-gradient-to-br from-stone-50 to-slate-200',
  'backdrop:bg-black/50 backdrop:backdrop-blur-[1px]',
].join(' ');

export default function ZoomArticle() {
  const ref = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [fact, setFact] = useAtom(zoomedFactAtom);

  const onClose = () => {
    setFact(null);
  };

  const onClick = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.target;
    if (el === ref.current) { // click outside the dialog
      setFact(null);
    }
  };

  useEffect(() => {
    if (fact) {
      ref.current?.showModal();
      bodyRef.current?.focus();
    } else {
      ref.current?.close();
    }
  }, [fact]);

  if (!fact) {
    return;
  }

  const { id, date, title, desc, summary, origin, tags, weight } = fact;

  return (
    <dialog ref={ref} className={dialogCls} onClose={onClose} onClick={onClick}>
      <div className='sticky top-0 flex items-center p-3 px-5 bg-gradient-to-br from-stone-50/80 to-slate-100/80'>
        <div className='leading-tight text-balance text-center text-lg sm:text-start '>
          {title}
        </div>

        <div className='font-mono text-sm mx-1 ml-auto px-1 whitespace-nowrap rounded-md ring-1 text-red-950 bg-gradient-to-br from-amber-200 to-amber-200/80'>
          {date}
        </div>

        <FactTagList tags={tags} className='mx-2' />

        <button className='btn p-px ml-auto hover:bg-white rounded-full hover:scale-125 hover:drop-shadow' aria-label='刪除' onClick={onClose}>
          <XMarkIcon className='stroke-slate-700 stroke-2' height={24} />
        </button>
      </div>

      <div ref={bodyRef} className='px-5 pb-4 max-h-[80vh] overflow-auto focus-visible:outline-none'>
        <div className={`text-opacity-90 -mt-2 break-words ${tlStyles.mce}`}>
          <Html html={desc} />
        </div>

        <div className='flex items-center flex-wrap'>
          {present(summary) &&
            <div className={`relative text-opacity-90 p-1 py-0 ml-px mt-5 w-fit ring-1 ${tlStyles.mce}`}>
              <div className={tlStyles['summary-mark']} title='摘要' aria-label='摘要'></div>
              <Html html={summary} />
            </div>
          }

          {present(origin) &&
            <div className={`text-xs py-1 mt-5 w-fit text-zinc-700 ${tlStyles.origin}`}>
              <Html html={origin} />
            </div>
          }
        </div>
      </div>
    </dialog>
  );
}
