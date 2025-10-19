'use client'

import { useCallback, useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { pickAtom, picksModeAtom, pickSavedAtom } from './store';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';
import PickRow from '@/app/facts/PickRow';
import PicksLoading from '@/app/facts/PicksLoading';
import type { RecentPicksItemProps } from '@/models/facts';
import { QuestionMarkCircleIcon, ListBulletIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Pick({ initialPick }: {
  initialPick: RecentPicksItemProps;  // pick from server side
}) {
  const [pick, setPick] = useAtom(pickAtom);
  const [saved, setSaved] = useAtom(pickSavedAtom);
  const setPicksMode = useSetAtom(picksModeAtom);

  const onTake = useCallback(() => {
    if (pick) {
      const { id, title, desc, factIds, state, userId, userName, publishedAt, createdAt, changes, changedAt } = pick;
      setPick({
        id,
        title: title || '',
        desc: desc || '',
        factIds: factIds || [],
        state: state || 'draft',
        userId: userId!,
        userName: userName!,
        publishedAt: publishedAt,
        createdAt: createdAt,
        changes: changes || 0,
        changedAt: changedAt,
      });
    }
  }, [pick, setPick]);

  const onUp = useCallback(() => {
    setPicksMode('index');
  }, [setPicksMode]);

  const onDismissSaved = useCallback(() => {
    setSaved(false);
  }, [setSaved])

  useEffect(() => {
    if (!pick && initialPick) {
      setPick(initialPick);
    }
  }, [pick, initialPick, setPick]);

  const currentPick = pick || initialPick;

  if (!currentPick) {
    return;
  }

  const { id, title, desc, factIds, state, userId, userName } = currentPick;

  return (
    <>
      <header className='flex items-center px-3 pb-1'>
        <h2 className='text-slate-600'>
          公開選集（單篇）
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
        <Tooltip placement='top'>
          <TooltipTrigger className=''>
            <ListBulletIcon className='ml-1 rounded stroke-slate-700/75 cursor-pointer hover:stroke-black' height={20} onClick={onUp} />
          </TooltipTrigger>
          <TooltipContent className="p-2 text-sm rounded box-border w-max z-[1002] bg-slate-100 ring-1 leading-relaxed shadow-lg">
            返回選集列表
          </TooltipContent>
        </Tooltip>
      </header>

      <div className='text-base pt-2 pb-8 pr-3 ml-3 ring-red-500 overflow-y-scroll scrollbar-thin'>

        {saved &&
          <div className='w-fit flex items-center mx-auto gap-x-3 bg-lime-300/75 ring ring-lime-500 p-1 px-4 my-2 rounded'>
            儲存成功
            <XMarkIcon className='ml-auto cursor-pointer fill-slate-500 hover:scale-125' height={20} onClick={onDismissSaved} />
          </div>
        }

        <PicksLoading />
        <ol className=''>
          <PickRow pick={currentPick} readingPickId={currentPick.id} onTake={onTake} />
        </ol>
      </div>

      <footer className='flex items-center justify-center text-xs text-slate-500 p-2 pb-px rounded'>
        這是一篇使用者分享的內容，請留意個人意見不一定正確
      </footer>
    </>
  );
}
