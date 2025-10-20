'use client'

import { useCallback, useEffect } from 'react';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { jsonReviver } from '@/lib/utils';
import { picksAtom, pickAtom, picksModeAtom, loadingPicksAtom, initialPickLoadedAtom, pickSavedAtom } from './store';
import { addAlertAtom } from '@/components/store';
import type { RecentPicksItemProps } from '@/models/facts';
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
      const fetched: {items: RecentPicksItemProps[]} = JSON.parse(json, jsonReviver);
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

export default function PickList() {
  const fetchPicks = useSetAtom(fetchPicksAtom);
  const picks = useAtomValue(picksAtom);
  const [readingPick, setPick] = useAtom(pickAtom);
  const setPicksMode = useSetAtom(picksModeAtom);
  const setLoading = useSetAtom(loadingPicksAtom);
  const [initLoad, setInitLoad] = useAtom(initialPickLoadedAtom);
  const setSaved = useSetAtom(pickSavedAtom);

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
        // setPicksMode('item');  // Stay in index mode, leave more info to user
      }
    }
  }, [picks, setPick]);

  const onItemMode = useCallback(() => {
    setPicksMode('item');
  }, [setPicksMode]);

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

  return (
    <>
      <header className='flex items-center px-3 pb-1'>
        <h2 className='text-slate-600'>
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

      <div className='text-base pt-2 pb-8 pr-3 ml-3 ring-red-500 overflow-y-scroll scrollbar-thin'>
        <PicksLoading />
        <ol className={`flex flex-col ${picksStyles['pick-list']}`}>
          {picks.map(pick =>
            <PickRow key={pick.id} readingPickId={readingPick?.id || null} pick={pick} onTake={onTake} onItemMode={onItemMode} />
          )}
        </ol>
      </div>
    </>
  );
}
