"use client"

import { format, formatISO, formatDistanceToNow, formatDistance } from '@/lib/date-fp';
import StateLabel from './StateLabel';
import { ArrowLongRightIcon } from '@heroicons/react/24/solid';

interface Foodable {
  spotState: string;
  material: string | null;
  spawnedAt: Date | number | null;
  removedAt: Date | number | null;
  [key: string]: any;
}

export default function FoodLife({ spot, now }: {
  spot: Foodable,
  now: Date | null
}) {
  if (!now) {
    return;
  }
  const { spawnedAt, removedAt, spotState } = spot;
  const formatTime = format({}, 'H:m');
  const spawned = spawnedAt ? formatTime(spawnedAt) : '??';
  const removed = removedAt ? formatTime(removedAt) : '??';
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

      {duration &&
        <span className='text-sm whitespace-nowrap font-mono'>
          （{duration.replace('大約', '').trim()}）
        </span>
      }

      <div className='text-xs font-mono opacity-60 flex items-center'>
        {spawned}
        <ArrowLongRightIcon className='inline fill-gray-600 mx-[-9px]' width={48} height={24} />
        {removed}
      </div>
    </div>
  );
}

