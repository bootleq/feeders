"use client"

import * as R from 'ramda';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAtomValue } from 'jotai';
import { formatDistanceToNow } from '@/lib/date-fp';

import { viewItemAtom } from './store';
import { visitArea } from './util';

import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';
import ActionLabel from './ActionLabel';
import FoodLife from './FoodLife';
import { UserCircleIcon } from '@heroicons/react/24/solid';

export default function SpotInfo() {
  const spot = useAtomValue(viewItemAtom);
  const [autoExpand, setAutoExpand] = useState(false);
  const [isOverflow, setIsOverflow] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const viewBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = viewBoxRef.current;
    if (container && container.scrollHeight > container.clientHeight) {
      setIsOverflow(true);
    } else {
      setIsOverflow(false);
    }
  }, [spot]);

  useEffect(() => {
    setNow(new Date());
  }, [spot]);

  const descClass = [
    'leading-6 min-h-[calc(1.5rem*7)] mt-1 pt-1 pb-[calc(1.5rem*1.2)]',
    'scrollbar-thin scrollbar-track-slate-300 scrollbar-thumb-slate-700',
    `resize-y ${autoExpand ? 'overflow-auto' : 'overflow-auto h-[calc(1.5rem*7)]'}`,
    `bg-gradient-to-br from-stone-50 to-slate-100`,
  ].join(' ');

  if (R.isEmpty(spot) || R.isNil(spot)) {
    return (
      <div className='relative px-2 py-1'>
        <strong className='mb-1 block'><span className='invisible'>未選擇</span></strong>
        <span className='mr-2 flex'>
          <UserCircleIcon className='invisible' height={24} />
        </span>
        <div className={descClass}></div>
      </div>
    );
  }

  return (
    <div className='relative px-2 py-1'>
      <Tooltip placement='bottom-end'>
        <TooltipTrigger className='mb-1 block truncate'>
          <span>{spot.spotTitle}</span>
        </TooltipTrigger>
        <TooltipContent className="p-1 text-xs rounded box-border w-max z-[1002] bg-slate-100 ring-1">
          {spot.spotTitle}
        </TooltipContent>
      </Tooltip>

      <div className='flex flex-wrap justify-start items-center'>
        <span data-user-id={spot.userId} className='mr-2 text-sm flex items-center'>
          <UserCircleIcon className='fill-current' height={24} />
          USER NAME
        </span>
        {
          R.any(R.isNotNil)(R.props(['city', 'town'], spot)) ?
            <Link
              href={`/world/area/@${spot.lat},${spot.lon}`}
              onClick={visitArea(spot.lat, spot.lon)}
              className='break-keep whitespace-nowrap w-min cursor-pointer text-sm opacity-60 mr-2'
              prefetch={false}
            >
              {spot.city}{spot.town}
            </Link>
            : ''
        }

        <time className='text-sm font-mono whitespace-nowrap mr-2' dateTime={`${spot.createdAt}`}>
          {formatDistanceToNow(spot.createdAt).replace('大約', '')}
        </time>

        <ActionLabel action={spot.action} />
      </div>

      <FoodLife spot={spot} now={now} />

      <div className={descClass} ref={viewBoxRef} data-name='spot-view-item'>
        {spot.desc}
        {spot.desc}
        {spot.desc}
        {spot.desc}
        {spot.desc}
        {spot.desc}
        {spot.desc}
        {spot.desc}
      </div>
    </div>
  );
}