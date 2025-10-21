'use client'

import { useState, useCallback, useEffect } from 'react';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useThrottledCallback } from 'use-debounce';
import { jsonReviver } from '@/lib/utils';
import {
  myPicksAtom,
  pickAtom,
  picksModeAtom,
  loadingPicksAtom,
  initialPickLoadedAtom,
  filterByMarksAtom,
} from './store';
import { nowAtom, addAlertAtom } from '@/components/store';
import type { RecentPicksItemProps } from '@/models/facts';
import picksStyles from './picks.module.scss';
import PickRow from './PickRow';
import PicksLoading from '@/app/facts/PicksLoading';
import { GlobeAltIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { CursorArrowRippleIcon } from '@heroicons/react/24/solid';

const fetchMyPicksAtom = atom(
  null,
  async (get, set) => {
    try {
      const url = '/api/picks/my';
      const response = await fetch(url);
      const json = await response.text();
      const fetched: {items: RecentPicksItemProps[]} = JSON.parse(json, jsonReviver);
      if (response.ok) {
        set(myPicksAtom, fetched.items);
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
      <strong>未建立任何記錄</strong>
      <hr className='my-3' />
      <p className='font-bold mb-1'>
        如何新增？
      </p>
      <ul className='list-inside list-decimal'>
        <li>由側邊欄的「<strong>記號</strong>」開始</li>
        <li>點選「選取<CursorArrowRippleIcon className='stroke-slate-700 stroke-0 ml-1 inline' height={18} />」，然後從時間軸中點選一個事件，該事件會被加入「記號」列表</li>
        <li>在記號面板的<GlobeAltIcon className='inline mx-1' height={18} />選單，選擇「<ArrowUpTrayIcon className='stroke-current inline mr-1' height={18} />編輯與上傳」開始編輯</li>
        <li>完成並儲存後，就能在這裡找到記錄</li>
      </ul>
      <div className='flex items-center justify-center text-slate-400 text-3xl tracking-widest min-h-40 mt-6 border-dashed border-4 border-slate-300 rounded'>
        空無一物
      </div>
    </div>
  );
}

export default function MyPickList() {
  const fetchPicks = useSetAtom(fetchMyPicksAtom);
  const picks = useAtomValue(myPicksAtom);
  const setNow = useSetAtom(nowAtom);
  const setPicksMode = useSetAtom(picksModeAtom);
  const setFiltered = useSetAtom(filterByMarksAtom);
  const [readingPick, setPick] = useAtom(pickAtom);
  const [loading, setLoading] = useAtom(loadingPicksAtom);
  const [initLoad, setInitLoad] = useAtom(initialPickLoadedAtom);
  const [initScroll, setInitScroll] = useState(false);

  const throttledSetNow = useThrottledCallback(() => {
    setNow(new Date());
  }, 3000, { trailing: false });

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
      }
    }
  }, [picks, setPick, setFiltered]);

  const onEditMode = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    onTake(e);
    setPicksMode('edit');
  }, [onTake, setPicksMode]);

  useEffect(() => {
    throttledSetNow();
  }, [throttledSetNow]);

  useEffect(() => {
    if (!initLoad.includes('my')) {
      setLoading(true);
      fetchPicks();
      setInitLoad([...initLoad, 'my']);
    }
  }, [initLoad, setInitLoad, setLoading, fetchPicks]);

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

  return (
    <>
      <header className='flex items-center px-3 pb-1'>
        <h2 className='text-slate-600'>
          我的選集
        </h2>
      </header>

      <div className='text-base pt-2 pb-8 pr-3 ml-3 ring-red-500 overflow-y-scroll scrollbar-thin'>
        <PicksLoading />
        {
          picks.length > 0 ?
            <ol className={`flex flex-col ${picksStyles['pick-list']}`}>
              {picks.map(pick =>
                <PickRow key={pick.id} readingPickId={readingPick?.id || null} pick={pick} onTake={onTake} onEditMode={onEditMode} />
              )}
            </ol>
            :
          !loading && <NoRecord />
        }
      </div>
    </>
  );
}
