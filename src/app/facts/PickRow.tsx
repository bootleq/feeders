import { useCallback } from 'react';
import Link from 'next/link';
import { useAtom, useAtomValue } from 'jotai';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';
import type { RecentPicksItemProps } from '@/models/facts';
import { present, shortenDate } from '@/lib/utils';
import { format, formatISO } from '@/lib/date-fp';
import { pickSavedAtom, picksModeAtom } from './store';
import { nowAtom } from '@/components/store';
import ClientDate from '@/components/ClientDate';
import { Desc } from '@/components/Desc';
import { UserCircleIcon, Square3Stack3DIcon } from '@heroicons/react/24/solid';
import { GlobeAltIcon, BookOpenIcon, MagnifyingGlassIcon, XMarkIcon, NoSymbolIcon } from '@heroicons/react/24/outline';
import CircleDashedIcon from '@/assets/circle-dashed.svg';

const draftTextColor = 'text-purple-700';

const tooltipCls = [
  'text-xs p-1 px-2 rounded box-border w-max max-w-[calc(100vw_-_10px)] z-[1002]',
  'bg-gradient-to-br from-stone-50 to-slate-100 ring-2 ring-offset-1 ring-slate-300 shadow-lg',
].join(' ')

function Separator() {
  return (
    <div role='separator' className='flex items-center justify-center w-full h-14 mb-1'>
      <div className='h-1 w-[98%] border-t border-dotted border-slate-700 translate-y-px'>
      </div>
    </div>
  );
}

function Dropped({ pick }: {
  pick: RecentPicksItemProps,
}) {
  const now = useAtomValue(nowAtom);
  const { publishedAt } = pick;
  return (
    <li className=''>
      <article>
        <header className='flex flex-col mb-1 gap-y-px'>
          <div className='flex items-center my-px mb-0'>
            <Tooltip placement='top'>
              <TooltipTrigger className='text-red-950/75 cursor-help font-bold'>
                已隱藏
              </TooltipTrigger>
              <TooltipContent className={`${tooltipCls}`}>
                這個項目受到網站管理處分，只有作者能看見內容
              </TooltipContent>
            </Tooltip>
            <div className='ml-auto flex items-center'>
              <NoSymbolIcon className='ml-1 rounded stroke-slate-700/75 cursor-not-allowed' height={18} aria-label='禁止' />
            </div>
          </div>

          <div className='mb-1 flex flex-wrap justify-start gap-x-1 text-slate-600 text-sm items-center opacity-50'>
            <div className='break-keep mr-1 flex items-center text-inherit'>
              <UserCircleIcon className='fill-current' height={18} />
            </div>

            {publishedAt &&
              <Tooltip placement='top'>
                <TooltipTrigger className='text-black cursor-auto'>
                  <div className={`break-keep text-inherit rounded flex items-center`}>
                    <NoSymbolIcon className='mr-1' height={18} aria-label='禁止' />
                    <ClientDate fallback={<span className='opacity-50'>----/-/-</span>}>
                      <time dateTime={formatISO({}, publishedAt)}>
                        {shortenDate(publishedAt, now)}
                      </time>
                    </ClientDate>
                  </div>
                </TooltipTrigger>
                <TooltipContent className={`${tooltipCls}`}>
                  原始發表日期：{ format({}, 'yyyy/MM/dd HH:mm', publishedAt) }
                </TooltipContent>
              </Tooltip>
            }
          </div>
        </header>

        <Desc value='（內容已隱藏）' className='opacity-50 max-h-96 overflow-auto md:max-w-xl mb-1 mx-px rounded' />
      </article>
      <Separator />
    </li>
  );
}

export default function PickRow({ pick, readingPickId, onTake, onItemMode, onEditMode }: {
  pick: RecentPicksItemProps,
  readingPickId: number | null,
  onTake: (e: React.MouseEvent<HTMLButtonElement>) => void,
  onItemMode?: () => void,
  onEditMode?: (e: React.MouseEvent<HTMLButtonElement>) => void,
}) {
  const now = useAtomValue(nowAtom);
  const [saved, setSaved] = useAtom(pickSavedAtom);
  const picksMode = useAtomValue(picksModeAtom);

  const onDismissSaved = useCallback(() => {
    setSaved(false);
  }, [setSaved])

  const { id, title, desc, factIds, state, userId, userName, publishedAt, createdAt, changes, changedAt } = pick;
  const bookRead = readingPickId === id;
  const inPrivate = picksMode === 'my';
  const isBanned = state === 'dropped';
  const canEdit = !isBanned;
  const idProp = present(id) ? { id: `pick-${id}` } : {};

  if (!inPrivate && isBanned) {
    // Completely hide from public
    return <Dropped pick={pick} />;
  }

  return (
    <li>
      <article {...idProp} className={` ${inPrivate && isBanned ? 'bg-slate-300 pb-1 -translate-y-2' : ''}`}>
        {inPrivate && isBanned &&
          <div className='w-fit flex items-center mx-auto gap-x-3 bg-red-300/75 ring-[4px] ring-red-500 p-2 px-5 my-2 translate-y-4 shadow-xl rounded'>
            受到管制處分
          </div>
        }
        {saved && bookRead &&
          <div className='w-fit flex items-center mx-auto gap-x-3 bg-lime-300/75 ring-[4px] ring-lime-500 p-2 px-5 my-2 translate-y-4 shadow-xl rounded'>
            🎉 儲存成功
            <XMarkIcon className='ml-auto cursor-pointer fill-slate-500 hover:scale-125' height={20} onClick={onDismissSaved} />
          </div>
        }
        <header className='flex flex-col mb-1 gap-y-px mb-1'>
          <div className='flex items-center my-px'>
            <h2 className={`font-bold font-mixed ${state === 'published' ? '' : draftTextColor}`}>
              {title}
              { state === 'draft' && <span className='text-slate-500 font-normal'>（草稿）</span> }
            </h2>
            <div className='ml-auto flex items-center'>
              {state === 'published' &&
                <a className='mr-1 px-1 opacity-60 rounded-full hover:opacity-100 hover:-rotate-12 hover:scale-110' href={`/facts/picks/${id}/`} title='單篇連結'>
                  <img src='/assets/paper-clip.svg' alt='連結' width={16} height={16} className='max-w-none' />
                  <span className='sr-only'>單篇連結</span>
                </a>
              }
              <Tooltip placement='top'>
                <TooltipTrigger>
                  <div className='text-sm font-mono mr-3'>
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
                      <div className='btn ml-auto p-0 translate-x-px'>
                        <BookOpenIcon className='ring-2 ring-rose-200 rounded-lg cursor-help stroke-slate-700/75 bg-rose-100 hover:stroke-black' height={20} aria-label='閱讀' />
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
                      {canEdit && onEditMode &&
                        <button type='button' data-id={id} className='flex items-center gap-x-1 ml-auto mt-2 mb-1 btn bg-slate-100 text-slate-600 ring-1 hover:text-black hover:ring-2 hover:bg-white' onClick={onEditMode}>
                          <MagnifyingGlassIcon className='' height={18} aria-label='編輯' />
                          編輯
                        </button>
                      }
                    </TooltipContent>
                  </Tooltip>
                :
                  <Tooltip placement='right'>
                    <TooltipTrigger>
                      <button type='button' className='btn ml-auto p-0 translate-x-px rounded-lg' data-id={id} onClick={onTake}>
                        <BookOpenIcon className='rounded-lg stroke-slate-700/75 cursor-pointer hover:stroke-black' height={20} aria-label='閱讀' />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="px-2 py-1 text-sm rounded box-border w-max z-[1002] bg-slate-100 ring-1 leading-relaxed shadow-lg">
                      閱讀：將本篇選擇的事件顯示到側邊欄的「記號」面板
                    </TooltipContent>
                  </Tooltip>
              }
            </div>
          </div>

          <div className='mb-1 flex flex-wrap justify-start gap-x-4 text-slate-600 text-sm items-center'>
            <Link href={`/user/${userId}`} data-user-id={userId} className='break-keep mr-2 flex items-center hover:bg-yellow-300/50 text-inherit'>
              <UserCircleIcon className='fill-current' height={18} />
              {userName}
            </Link>

            {
              publishedAt ?
                <Tooltip placement='top'>
                  <TooltipTrigger className='text-black cursor-auto'>
                    <Link href={`/facts/picks/${id}`} className={`break-keep hover:bg-yellow-300/50 text-inherit rounded flex items-center ${state === 'published' ? 'text-stone-950' : draftTextColor}`}>
                      <GlobeAltIcon className='mr-1' height={18} aria-label='公開' />
                      <ClientDate fallback={<span className='opacity-50'>----/-/-</span>}>
                        <time dateTime={formatISO({}, publishedAt)}>
                          {shortenDate(publishedAt, now)}
                        </time>
                      </ClientDate>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent className={`${tooltipCls}`}>
                    { state !== 'published' && '原始' }發表日期：{ format({}, 'yyyy/MM/dd HH:mm', publishedAt) }
                    { inPrivate && <div>建立日期：{ format({}, 'yyyy/MM/dd HH:mm', createdAt) }</div> }
                  </TooltipContent>
                </Tooltip>
              :
              (createdAt &&
                <Tooltip placement='top'>
                  <TooltipTrigger className='cursor-auto'>
                    <Link href={`/facts/picks/${id}`} className={`break-keep hover:bg-yellow-300/50 text-inherit rounded flex items-center ${draftTextColor}`}>
                      <CircleDashedIcon className='mr-1' width={18} height={18} aria-label='草稿' />
                      <ClientDate fallback={<span className='opacity-50'>----/-/-</span>}>
                        <time dateTime={formatISO({}, createdAt)}>
                          {shortenDate(createdAt, now)}
                        </time>
                      </ClientDate>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent className={`${tooltipCls}`}>
                    建立日期：{ format({}, 'yyyy/MM/dd HH:mm', createdAt) }
                  </TooltipContent>
                </Tooltip>
              )
            }

            {changes > 0 ?
              <div className='flex items-center text-slate-500/75'>
                已編輯：
                <Tooltip placement='top-start'>
                  <TooltipTrigger className='cursor-text'>
                    <div>
                      <ClientDate fallback={<span className='opacity-50'>----/-/-</span>}>
                        <time dateTime={formatISO({}, changedAt)}>
                          {shortenDate(changedAt, now)}
                        </time>
                      </ClientDate>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className={`${tooltipCls}`}>
                    最後改版日期：{ format({}, 'yyyy/MM/dd HH:mm', changedAt) }
                  </TooltipContent>
                </Tooltip>
                <Tooltip placement='top-start'>
                  <TooltipTrigger className='flex items-center'>
                    <Link href={`/audit/pick/${id}`} className='inline-flex items-center justify-center p-1 ml-1 text-slate-500/75 hover:bg-purple-700/50 hover:text-white rounded-full' target='_blank'>
                      <Square3Stack3DIcon className='stroke-current mr-px' height={18} />
                      {changes}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent className={`${tooltipCls}`}>調閱編修記錄（在新分頁開啟）</TooltipContent>
                </Tooltip>
              </div>
              : ''
            }
          </div>
        </header>

        {present(desc) &&
        <Desc value={desc} className='max-h-96 overflow-auto md:max-w-xl lg:max-w-full mb-1 mx-px resize rounded font-mixed' />
        }
      </article>

      <Separator />
    </li>
  );
}
