'use client'

import { useState, useCallback, useEffect, useRef } from 'react';
import { useThrottledCallback } from 'use-debounce';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { jsonReviver } from '@/lib/utils';
import {
  picksAtom,
  pickAtom,
  picksModeAtom,
  loadingPicksAtom,
  initialPickLoadedAtom,
  pickSavedAtom,
  pickDisplayAtom,
  filterByMarksAtom,
} from './store';
import { addAlertAtom } from '@/components/store';
import type { PickProps } from '@/models/facts';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';
import picksStyles from './picks.module.scss';
import PickRow from './PickRow';
import PicksLoading from '@/app/facts/PicksLoading';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

const fetchPicksAtom = atom(
  null,
  async (get, set) => {
    try {
      const url = '/api/picks/';
      const response = await fetch(url);
      const json = await response.text();
      const fetched: {items: PickProps[]} = JSON.parse(json, jsonReviver);
      if (response.ok) {
        set(picksAtom, fetched.items);
      } else {
        const errorNode = <><code className='font-mono mr-1'>{response.status}</code>無法取得資料</>;
        set(addAlertAtom, 'error', errorNode);
      }
    } catch (e) {
      let errorNode;
      if (e instanceof SyntaxError) {
        errorNode = <span>非預期的回應內文</span>;
        console.log({SyntaxError: String(e)});
      } else {
        errorNode = <span>{String(e)}</span>;
      }
      set(addAlertAtom, 'error', errorNode);
    } finally {
      set(loadingPicksAtom, false);
    }
  }
);

function NoRecord() {
  return (
    <div className='mt-2'>
      <span className='line-through' >動保處獲報已前往現場，但沒有發現犬隻</span>
      <hr className='my-3' />
      <div className='flex items-center justify-center text-slate-400 text-3xl tracking-widest min-h-40 mt-6 border-dashed border-4 border-slate-300 rounded'>
        空無一物
      </div>
    </div>
  );
}

export default function PickList() {
  const fetchPicks = useSetAtom(fetchPicksAtom);
  const picks = useAtomValue(picksAtom);
  const [readingPick, setPick] = useAtom(pickAtom);
  const setPicksMode = useSetAtom(picksModeAtom);
  const setFiltered = useSetAtom(filterByMarksAtom);
  const [loading, setLoading] = useAtom(loadingPicksAtom);
  const [initLoad, setInitLoad] = useAtom(initialPickLoadedAtom);
  const [initScroll, setInitScroll] = useState(false);
  const setSaved = useSetAtom(pickSavedAtom);
  const displayMode = useAtomValue(pickDisplayAtom);

  const bodyRef = useRef<HTMLDivElement>(null);
  const [bodyScrolled, setBodyScrolled] = useState(false);

  const detectBodyScroll = useThrottledCallback(() => {
    const $body = bodyRef.current;
    if ($body && $body.scrollTop > 0) {
      setBodyScrolled(true);
    } else {
      setBodyScrolled(false);
    }
  }, 600, { trailing: true });

  const onTake = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const id = Number(e.currentTarget?.dataset?.id);
    if (id > 0) {
      const pick = picks.find(aPick => aPick.id === id);
      if (pick) {
        const { title, desc, factIds, state, userId, userName, publishedAt, createdAt, changes, changedAt } = pick;
        setPick({
          id,
          title: title || '',
          desc: desc || '',
          factIds: factIds,
          state: state || 'draft',
          userId: userId!,
          userName: userName!,
          publishedAt: publishedAt,
          createdAt: createdAt,
          changes: changes || 0,
          changedAt: changedAt,
        });
        setFiltered(true);
        // setPicksMode('item');  // Stay in index mode, leave more info to user
      }
    }
  }, [picks, setPick, setFiltered]);

  const onItemMode = useCallback(() => {
    setPicksMode('item');
  }, [setPicksMode]);

  const scrollToTop = useCallback(() => {
    bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!initLoad.includes('index')) {
      setLoading(true);
      fetchPicks();
      setInitLoad([...initLoad, 'index']);
    }
  }, [initLoad, setInitLoad, setLoading, fetchPicks]);

  useEffect(() => {
    setSaved(false);
  }, [setSaved]);

  useEffect(() => {
    if (!initScroll && readingPick?.id) {
      const $pick = document.querySelector(`#pick-${readingPick.id}`);
      if ($pick) {
        $pick.classList.remove(picksStyles['animate-flash']);
        $pick.scrollIntoView({ block: 'center' });
        window.setTimeout(() => {
          $pick.classList.add(picksStyles['animate-flash']);
        });
      }
      setInitScroll(true);
    }
  }, [initScroll, readingPick]);

  useEffect(() => {
    const $body = bodyRef.current;
    $body?.addEventListener('scroll', detectBodyScroll);

    return () => {
      $body?.removeEventListener('scroll', detectBodyScroll);
    }
  }, [detectBodyScroll]);

  return (
    <>
      <header className={`flex items-center px-3 pb-2 border-slate-300 transition-shadow duration-200 ${bodyScrolled ? 'border-b shadow-xl' : ''}`}>
        <h2 className='text-slate-600' onClick={scrollToTop}>
          公開選集
        </h2>
        <Tooltip placement='top'>
          <TooltipTrigger className='truncate'>
            <QuestionMarkCircleIcon className='ml-1 stroke-slate-700/75 cursor-help' height={20} />
          </TooltipTrigger>
          <TooltipContent className="p-2 text-sm rounded box-border w-max z-[1002] bg-slate-100 ring-1 leading-relaxed shadow-lg">
            這裡是由眾人分享的「記號」清單，
            <br />
            請注意其個人意見不一定正確。
          </TooltipContent>
        </Tooltip>
      </header>

      <div ref={bodyRef} className='text-base pt-2 pb-8 pr-3 ml-3 ring-red-500 overflow-y-scroll scrollbar-thin'>
        <PicksLoading />
        {
          picks.length > 0 ?
            <ol className={`flex flex-col ${picksStyles['pick-list']}`} data-display-mode={displayMode}>
              {picks.map(pick =>
                <PickRow key={pick.id} readingPickId={readingPick?.id || null} pick={pick} onTake={onTake} onItemMode={onItemMode} />
              )}
            </ol>
            :
          !loading && <NoRecord />
        }
      </div>
    </>
  );
}
