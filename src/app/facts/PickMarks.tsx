'use client'

import * as R from 'ramda';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import type { Fact, FactMark } from './store';
import type { RecentPicksItemProps } from '@/models/facts';
import { findFactElement, clearMarkIndicators } from './utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';
import {
  pickAtom,
  removePickMarkAtom,
  picksModeAtom,
  timelineInterObserverAtom,
} from './store';
import { XMarkIcon } from '@heroicons/react/24/outline';
import tlStyles from './timeline.module.scss';

const markDateCls = [
  'font-mono text-sm whitespace-nowrap ml-px mr-1 px-1 rounded-md ring-1 cursor-pointer',
  'text-red-950 bg-gradient-to-br from-rose-200 to-rose-100/80',
  'hover:ring hover:text-black',
].join(' ');

type FactsDictionary = Record<string, FactMark>;

function buildFactsDictionary(facts: Fact[]) {
  return R.reduce(
    (acc, fact) => {
      const { id, date, title } = fact;
      const anchor = `fact-${date}_${id}`;
      const item = { id, anchor, title };
      acc[id] = item;
      return acc;
    },
    {} as FactsDictionary,
    facts
  );
}

function translateFact(dict: FactsDictionary, factId: number) {
  const fact = dict[factId];
  if (fact) {
    const { id, anchor, title } = fact;
    return { id, anchor, title };
  } else {
    throw new Error(`Can't find Fact for mark, with id: ${factId}`);
  }
}

function sortByAnchor(ids: number[], dict: FactsDictionary) {
  return R.sortBy(
    (id: number) => R.toString(R.path([id, 'anchor'], dict))
  )(ids);
}

type PickMark = FactMark & {
  onRemove: (e: React.MouseEvent<HTMLButtonElement>) => void,
}

function Mark({ id, anchor, title, onRemove }: PickMark) {
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

  const date = R.match(/fact-(.+)_\d+/, anchor)[1];
  const datePadEnd = date?.length < 10 ? <span className=''>{'\u00A0'.repeat(10 - date.length)}</span> : '';

  return (
    <li className='flex items-center py-1' data-anchor={anchor} onMouseEnter={onMouseEnter} onMouseLeave={clearMarkIndicators}>
      <a className={markDateCls} data-anchor={anchor} href={`#${anchor}`}>
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

export default function PickMarks({ pick, facts }: {
  pick: RecentPicksItemProps,
  facts: Fact[],
}) {
  const ref = useRef<HTMLDivElement>(null);
  const latestPickId = useRef<number|null>(null);
  const factsDictionary = useMemo(() => buildFactsDictionary(facts), [facts]);
  const translate = useMemo(() => R.partial(translateFact, [factsDictionary]), [factsDictionary]);

  const setPick = useSetAtom(pickAtom);
  const removeMark = useSetAtom(removePickMarkAtom);
  const setPicksMode = useSetAtom(picksModeAtom);

  useEffect(() => {
    const sorted = sortByAnchor(pick.factIds || [], factsDictionary);
    if (!R.equals(pick.factIds, sorted)) {
      setPick({ ...pick, factIds: sorted });
    }
  }, [pick, factsDictionary, setPick]);

  useEffect(() => {
    const el = ref.current;
    if (el && pick && pick.id !== latestPickId.current) {
      latestPickId.current = pick.id;
      el.classList.remove(tlStyles['animate-flash']);
      window.setTimeout(() => {
        el.classList.add(tlStyles['animate-flash']);
      });
    }
  }, [pick]);

  const onQuit = useCallback(() => {
    setPick(null);
    setPicksMode('');
  }, [setPick, setPicksMode]);

  const onRemoveMark = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    const id = Number(el.dataset.factId);
    if (id > 0) {
      removeMark(id);
    }
  }, [removeMark]);

  const items = pick.factIds ? pick.factIds.map(translate) : [];

  if (!facts) {
    return;
  }

  return (
    <div ref={ref} className='w-full flex-grow'>
      <div className='w-full text-sm flex items-center gap-x-1 rounded py-1 -mb-1 hover:bg-rose-100'>
        <Tooltip placement='top'>
          <TooltipTrigger className='truncate'>
            <div className=''>
              {pick.title}
            </div>
          </TooltipTrigger>
          <TooltipContent className="p-1 text-xs rounded box-border w-max z-[1002] bg-slate-100 ring-1 leading-relaxed">
            正在顯示選集的記號，要回到個人記號，請按關閉按鈕
            <br />
            標題：{pick.title}
          </TooltipContent>
        </Tooltip>
        <button className='btn p-px ml-2 bg-rose-100 hover:bg-white rounded-full hover:scale-125 hover:drop-shadow' aria-label='刪除' onClick={onQuit}>
          <XMarkIcon className='stroke-slate-700 stroke-2' height={16} />
        </button>
      </div>

      <ul className='divide-y-2 divide-slate-300 w-full'>
        {
          items.map(i => (
            <Mark key={i.id} id={i.id} anchor={i.anchor} title={i.title} onRemove={onRemoveMark} />
          ))
        }
      </ul>
    </div>
  );
}
