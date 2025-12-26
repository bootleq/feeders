import * as R from 'ramda';
import { useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';
import { timelineInterObserverAtom } from './store';
import { findFactElement, clearMarkIndicators } from './utils';
import tlStyles from './timeline.module.scss';
import { XMarkIcon } from '@heroicons/react/24/outline';

const markDateCls = [
  'font-mono text-sm whitespace-nowrap ml-px mr-1 px-1 rounded-md ring-1 cursor-pointer',
  'text-red-950 bg-gradient-to-br',
  'hover:ring hover:text-black',
].join(' ');

export type FactMark = {
  id: number,
  anchor: string,
  title: string,
};

type MarkProps = FactMark & {
  onRemove: (e: React.MouseEvent<HTMLButtonElement>) => void,
  labelCls: string,
}

export default function Mark({ id, anchor, title, onRemove, labelCls }: MarkProps) {
  const interObserver = useAtomValue(timelineInterObserverAtom);

  const onMouseEnter = useCallback((e: React.MouseEvent<HTMLLIElement>) => {
    const el = e.currentTarget;
    const { anchor } = el.dataset;
    const fact = findFactElement(anchor);
    const target = fact?.querySelector('[data-role="fact-date"]');
    if (target) {
      target.classList.add(tlStyles['peeking-target']);
      interObserver?.observe(target);
    }
  }, [interObserver]);

  const date = R.match(/fact-(.+)_\d+/, anchor)[1].replace(/^0*/, '');
  const datePadEnd = date?.length < 10 ? <span className=''>{'\u00A0'.repeat(10 - date.length)}</span> : '';

  return (
    <li className='flex items-center py-1' data-anchor={anchor} data-fact-id={id} onMouseEnter={onMouseEnter} onMouseLeave={clearMarkIndicators}>
      <a className={`${markDateCls} ${labelCls}`} data-anchor={anchor} href={`#${anchor}`}>
        {date}{datePadEnd}
      </a>
      <Tooltip placement='right'>
        <TooltipTrigger className='mb-1 block truncate'>
          <div className='text-xs truncate'>
            {title}
          </div>
        </TooltipTrigger>
        <TooltipContent className="p-1 text-xs rounded box-border w-max z-[1002] bg-slate-100 ring-1">
          {title}
        </TooltipContent>
      </Tooltip>
      <button className='btn p-px ml-auto hover:bg-white rounded-full hover:scale-125 hover:drop-shadow' aria-label='刪除' data-fact-id={id} onClick={onRemove}>
        <XMarkIcon className='stroke-slate-700 stroke-2' height={16} />
      </button>
    </li>
  );
}
