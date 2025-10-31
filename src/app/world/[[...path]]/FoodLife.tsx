"use client"

import { format, formatDistance } from '@/lib/date-fp';
import { isToday } from 'date-fns';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';
import ClientDate from '@/components/ClientDate';
import StateLabel from './StateLabel';
import { ArrowLongRightIcon } from '@heroicons/react/24/solid';

interface Foodable {
  spotState: string;
  material: string | null;
  spawnedAt: Date | null;
  removedAt: Date | null;
  [key: string]: any;
}

const tooltipCls = [
  'text-xs p-1 px-2 rounded box-border w-max max-w-[calc(100vw_-_10px)] z-[1002]',
  'bg-gradient-to-br from-stone-50 to-slate-100 ring-2 ring-offset-1 ring-slate-300',
].join(' ')

const dateFormatter = (date: Date) => {
  const dateFormat = isToday(date) ? 'HH:mm' : 'M/d HH:mm';
  return format({}, dateFormat, date);
};

function FallbackDate() {
  return (
    <span className='opacity-50'>--:--</span>
  );
}

export default function FoodLife({ spot, now }: {
  spot: Foodable,
  now: Date | null
}) {
  if (!now) {
    return;
  }
  const { spawnedAt, removedAt: latestRemovedAt, spotState } = spot;
  const removedAt = latestRemovedAt && spawnedAt && latestRemovedAt > spawnedAt ? latestRemovedAt : null;

  const spawned = spawnedAt ? dateFormatter(spawnedAt) : '??';
  const removed = removedAt ? dateFormatter(removedAt) : '??';
  let duration = '';

  if (spawnedAt && removedAt) {
    duration = formatDistance(removedAt || now, spawnedAt);
  }

  return (
    <div className='flex items-center flex-wrap my-1'>
      <StateLabel spotState={spotState}>{spotState}</StateLabel>
      <span className='whitespace-nowrap mr-1'>
        {spot.material}
      </span>

      <Tooltip>
        <TooltipTrigger className=''>
          <div className='flex items-center'>
            {duration &&
              <span className='text-sm whitespace-nowrap font-mono'>
                （{duration.replace('大約', '').trim()}）
              </span>
            }

            <div className='text-xs font-mono opacity-60 flex items-center'>
              <ClientDate fallback={<FallbackDate />}>{spawned}</ClientDate>
              <ArrowLongRightIcon className='inline fill-gray-600 mx-[-9px]' width={48} height={24} />
              <ClientDate fallback={<FallbackDate />}>{removed}</ClientDate>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className={`${tooltipCls}`}>
          食物存活時間（放置 → 清除）
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

