'use client'

import * as R from 'ramda';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import Mark from './Mark';
import type { Fact } from './store';
import type { FactMark } from './Mark';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';
import {
  pickAtom,
  localMarksAtom,
  removeLocalMarkAtom,
  removePickMarkAtom,
  picksModeAtom,
  latestAddMarkAtom,
} from './store';
import { XMarkIcon } from '@heroicons/react/24/outline';
import tlStyles from './timeline.module.scss';

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

function getFactIdFromButton(e: React.MouseEvent<HTMLButtonElement>) {
  const el = e.currentTarget;
  const id = Number(el.dataset.factId);
  return id;
}

function resetMarkOffscreen() {
  const tl = document.querySelector('[data-role="timeline"]') as HTMLElement;
  if (tl) { delete tl.dataset.markOffscreen; }
}

function highlightAddedMark(id: number) {
  const $mark = document.querySelector(`[data-role="sidebar"] li[data-fact-id="${id}"]`) as HTMLElement;
  if ($mark) {
    $mark.classList.remove(tlStyles['animate-flash']);
    $mark.scrollIntoView({ block: 'center' });
    window.setTimeout(() => {
      $mark.classList.add(tlStyles['animate-flash']);
    });
  }
}

export default function PickMarks({ facts }: {
  facts: Fact[],
}) {
  const ref = useRef<HTMLDivElement>(null);
  const latestPickId = useRef<number|null>(null);
  const factsDictionary = useMemo(() => buildFactsDictionary(facts), [facts]);
  const translate = useMemo(() => R.partial(translateFact, [factsDictionary]), [factsDictionary]);
  const [latestAdded, setLatestAdded] = useAtom(latestAddMarkAtom);

  const [localMarks, setLocalMarks] = useAtom(localMarksAtom);
  const removeLocalMark = useSetAtom(removeLocalMarkAtom);

  const [pick, setPick] = useAtom(pickAtom);
  const removePickMark = useSetAtom(removePickMarkAtom);
  const setPicksMode = useSetAtom(picksModeAtom);

  useEffect(() => {
    if (pick) {
      const sorted = sortByAnchor(pick.factIds || [], factsDictionary);
      if (!R.equals(pick.factIds, sorted)) {
        setPick({ ...pick, factIds: sorted });
      }
    }
  }, [pick, setPick, factsDictionary]);

  useEffect(() => {
    if (localMarks.length) {
      const sorted = sortByAnchor(localMarks || [], factsDictionary);
      if (!R.equals(localMarks, sorted)) {
        setLocalMarks(sorted);
      }
    }
  }, [localMarks, setLocalMarks, factsDictionary]);

  useEffect(() => {
    if (latestAdded) {
      highlightAddedMark(latestAdded);
      setLatestAdded(null);
    }
  }, [latestAdded, setLatestAdded]);

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

  const onRemoveLocalMark = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const id = getFactIdFromButton(e);
    if (id > 0) {
      removeLocalMark(id);
      resetMarkOffscreen();
    }
  }, [removeLocalMark]);

  const onRemovePickMark = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const id = getFactIdFromButton(e);
    if (id > 0) {
      removePickMark(id);
      resetMarkOffscreen();
    }
  }, [removePickMark]);

  const pickItems = useMemo(() => {
    if (pick) {
      return pick.factIds ? pick.factIds.map(translate) : [];
    }
    return [];
  }, [pick, translate]);

  const localItems = useMemo(() => {
    if (localMarks.length) {
      return localMarks.map(translate);
    }
    return [];
  }, [localMarks, translate]);

  if (!facts) {
    return;
  }

  const items    = pick ? pickItems : localItems;
  const onRemove = pick ? onRemovePickMark : onRemoveLocalMark;
  const labelCls = pick ? 'from-rose-200 to-rose-100/80' : 'from-amber-200 to-amber-200/80';

  return (
    <div ref={ref} className='w-full flex-grow'>
      {pick &&
        <div className='w-full text-sm flex items-center gap-x-1 rounded py-1 -mb-px hover:bg-rose-100'>
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
      }

      <ul className='divide-y-2 divide-slate-300 w-full'>
        {
          items.map(i => (
            <Mark key={i.id} id={i.id} anchor={i.anchor} title={i.title} onRemove={onRemove} labelCls={labelCls} />
          ))
        }
      </ul>
    </div>
  );
}
