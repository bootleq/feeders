"use client"

import * as R from 'ramda';
import { useEffect, useRef, useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { present, SITE_NAME } from '@/lib/utils';
import { zoomedFactAtom, slugAtom, SLUG_PATTERN } from './store';
import { useHydrateAtoms } from 'jotai/utils';
import { BASE_META } from '@/app/facts/utils';
import tlStyles from './timeline.module.scss';
import FactTagList from './FactTagList';
import Html from '@/components/Html';
import { XMarkIcon } from '@heroicons/react/24/outline';

const dialogCls = [
  'flex flex-col overscroll-y-contain',
  '[&:not(:open)]:top-[50%] [&:not(:open)]:-translate-y-1/2 z-40',
  'min-w-[40vw] min-h-[20vh] rounded drop-shadow-md',
  'max-w-full lg:max-w-screen-lg xl:max-w-screen-xl',
  'bg-gradient-to-br from-stone-50 to-slate-200',
  'backdrop:bg-black/50 backdrop:backdrop-blur-[1px]',
].join(' ');

export default function ZoomArticle({ initialFact }: {
  initialFact: any,
}) {
  useHydrateAtoms([
    [zoomedFactAtom, initialFact],
  ]);
  const ref = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [fact, setFact] = useAtom(zoomedFactAtom);
  const [hasClosed, setHasClosed] = useState(false);
  const [titleCollapsed, setTitleCollapsed] = useState(false);

  const onClose = () => {
    setFact(null);
    window.history.pushState(null, '', '/facts/');

    if (!hasClosed) {
      window.document.title = `${BASE_META.title} - ${SITE_NAME}`;
      setHasClosed(true);
    }
  };

  const onResizeTitle = () => {
    setTitleCollapsed(R.not);
  };

  const onClick = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.target;
    if (el === ref.current) { // click outside the dialog
      onClose();
    }
  };

  useEffect(() => {
    if (fact) {
      const body = bodyRef.current;
      ref.current?.showModal();
      body?.focus();
      body?.querySelectorAll('details').forEach(dt => { dt.open = true });
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
      <div className='sticky top-0 flex items-center flex-wrap p-3 px-2 sm:px-5 gap-y-2 bg-gradient-to-br from-stone-50/80 to-slate-100/80'>
        <div className={`leading-tight text-center text-lg sm:text-start sm:text-balance ${titleCollapsed ? 'truncate sm:whitespace-normal' : 'text-balance'}`}>
          {title}
        </div>

        <div className='text-sm ml-auto flex items-center'>
          <button className='sm:hidden flex items-center btn px-1 py-0 mx-1 text-slate-400 text-xs focus:ring-0 focus-visible:ring' onClick={onResizeTitle}>
            <span className='text-base mr-1'>{titleCollapsed ? ' ⇳' : '↸'}</span> title
          </button>
          <div className='font-mono mx-1 px-1 whitespace-nowrap rounded-md ring-1 text-red-950 bg-gradient-to-br from-amber-200 to-amber-200/80'>
            {date}
          </div>
        </div>

        <FactTagList tags={tags} className={`mx-2 ${titleCollapsed ? 'hidden sm:flex' : ''}`} />

        <button className='btn p-px ml-auto hover:bg-white rounded-full hover:scale-125 hover:drop-shadow' aria-label='刪除' onClick={onClose}>
          <XMarkIcon className='stroke-slate-700 stroke-2' height={24} />
        </button>
      </div>

      <div ref={bodyRef} tabIndex={0} className='px-2 sm:px-5 pb-2.5 mt-auto max-h-[80vh] overflow-auto focus-visible:outline-none'>
        <div className={`text-opacity-90 -mt-2 break-words ${tlStyles.mce}`}>
          <Html html={desc} />
        </div>

        <div className='flex items-center flex-wrap gap-x-3'>
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
