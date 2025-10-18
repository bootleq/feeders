import Link from 'next/link';
import { useAtomValue } from 'jotai';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';
import type { RecentPicksItemProps } from '@/models/facts';
import { present } from '@/lib/utils';
import { format, formatISO, formatDistanceToNow } from '@/lib/date-fp';
import { differenceInDays } from 'date-fns';
import { nowAtom } from '@/components/store';
import ClientDate from '@/components/ClientDate';
import { Desc } from '@/components/Desc';
import { UserCircleIcon, Square3Stack3DIcon } from '@heroicons/react/24/solid';
import { BookOpenIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const tooltipCls = [
  'text-xs p-1 px-2 rounded box-border w-max max-w-[calc(100vw_-_10px)] z-[1002]',
  'bg-gradient-to-br from-stone-50 to-slate-100 ring-2 ring-offset-1 ring-slate-300 shadow-lg',
].join(' ')

function shortenDate(date: Date, now?: Date) {
  if (!now || !date) return '----/-/-';

  if (now.getFullYear() === date.getFullYear()) {
    const diff = differenceInDays(now, date);
    if (diff > 18) {
      return format({}, 'M/d', date);
    } else {
      return formatDistanceToNow(date).replace('大約', '');
    }
  }

  return format({}, 'yyyy/MM/dd', date);
}

export default function PickRow({ pick, readingPickId, onTake, onItemMode }: {
  pick: RecentPicksItemProps,
  readingPickId: number | null,
  onTake: (e: React.MouseEvent<HTMLButtonElement>) => void,
  onItemMode?: () => void,
}) {
  const now = useAtomValue(nowAtom);

  const { id, title, desc, factIds, state, userId, userName, createdAt, changes, changedAt } = pick;
  const bookRead = readingPickId === id;

  return (
    <li className='pt-4 first:pt-0'>
      <article>
        <header className='flex flex-col mb-1'>
          <div className='flex items-center my-px mb-0'>
            <h2 className='font-bold'>{title}</h2>
            <div className='ml-auto flex items-center'>
              <Tooltip placement='top'>
                <TooltipTrigger>
                  <div className='text-sm font-mono'>
                    {factIds?.length}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="px-2 py-1 text-sm rounded box-border w-max z-[1002] bg-slate-100 ring-1 leading-relaxed shadow-lg">
                  這個選集包含了 <strong>{factIds?.length}</strong> 個事件
                </TooltipContent>
              </Tooltip>
              {
                bookRead ?
                  <Tooltip placement='top'>
                    <TooltipTrigger>
                      <div className='btn ml-auto pr-0 translate-x-px'>
                        <BookOpenIcon className='ml-1 ring-2 ring-rose-200 rounded-lg cursor-help stroke-slate-700/75 bg-rose-100 hover:stroke-black' height={20} aria-label='閱讀' />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="px-2 py-1 text-sm rounded box-border w-max z-[1002] bg-slate-100 ring-1 leading-relaxed shadow-lg">
                      事件已經顯示於側邊欄的「記號」面板
                      {onItemMode &&
                        <button type='button' className='flex items-center gap-x-1 ml-auto mt-2 mb-1 btn bg-slate-100 text-slate-600 ring-1 hover:text-black hover:ring-2 hover:bg-white' onClick={onItemMode}>
                          <MagnifyingGlassIcon className='' height={18} aria-label='閱讀' />
                          只顯示本篇
                        </button>
                      }
                    </TooltipContent>
                  </Tooltip>
                :
                  <Tooltip placement='right'>
                    <TooltipTrigger className=''>
                      <button type='button' className='btn ml-auto pr-0' data-id={id} onClick={onTake}>
                        <BookOpenIcon className='ml-1 rounded stroke-slate-700/75 cursor-pointer hover:stroke-black' height={20} aria-label='閱讀' />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="px-2 py-1 text-sm rounded box-border w-max z-[1002] bg-slate-100 ring-1 leading-relaxed shadow-lg">
                      閱讀：將本篇選擇的事件顯示到側邊欄的「記號」面板
                    </TooltipContent>
                  </Tooltip>
              }
            </div>
          </div>

          <div className='mb-1 flex flex-wrap justify-start gap-x-2 text-slate-600 text-sm items-center'>
            <Link href={`/user/${userId}`} data-user-id={userId} className='break-keep mr-2 flex items-center hover:bg-yellow-300/50 text-inherit'>
              <UserCircleIcon className='fill-current' height={18} />
              {userName}
            </Link>

            <Tooltip placement='top'>
              <TooltipTrigger className='cursor-auto'>
                <Link href={`/facts/picks/${id}`} className='break-keep hover:bg-yellow-300/50 text-inherit rounded'>
                  <ClientDate fallback={<span className='opacity-50'>----/-/-</span>}>
                    <time dateTime={formatISO({}, createdAt)}>
                      {shortenDate(createdAt, now)}
                    </time>
                  </ClientDate>
                </Link>
                <TooltipContent className={`${tooltipCls}`}>
                  建立日期：{ format({}, 'yyyy/MM/dd HH:mm', createdAt) }
                </TooltipContent>
              </TooltipTrigger>
            </Tooltip>

            {changes > 0 ?
              <div className='flex items-center text-slate-500/75'>
                已編輯：
                <Tooltip placement='top-start'>
                  <TooltipTrigger className='cursor-text'>
                    <ClientDate fallback={<span className='opacity-50'>----/-/-</span>}>
                      <time dateTime={formatISO({}, changedAt)}>
                        {shortenDate(changedAt, now)}
                      </time>
                    </ClientDate>
                    <TooltipContent className={`${tooltipCls}`}>
                      編輯日期：{ format({}, 'yyyy/MM/dd HH:mm', changedAt) }
                    </TooltipContent>
                  </TooltipTrigger>
                </Tooltip>
                <Tooltip placement='top-start'>
                  <TooltipTrigger className='flex items-center'>
                    <Link href={`/audit/picks/${id}`} className='inline-flex items-center justify-center p-1 ml-1 text-slate-500/75 hover:bg-purple-700/50 hover:text-white rounded-full' target='_blank'>
                      <Square3Stack3DIcon className='stroke-current mr-px' height={18} />
                      {changes}
                    </Link>
                    <TooltipContent className={`${tooltipCls}`}>調閱編修記錄（在新分頁開啟）</TooltipContent>
                  </TooltipTrigger>
                </Tooltip>
              </div>
              : ''
            }
          </div>
        </header>

        {present(desc) &&
          <Desc value={desc} className='max-h-96 overflow-auto md:max-w-xl mb-1 mx-px resize-y rounded' />
        }
      </article>
    </li>
  );
}
