"use client"

import * as R from 'ramda';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useAtom, useSetAtom } from 'jotai';
import { ScopeProvider } from 'jotai-scope'
import Link from 'next/link';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';
import ClientDate from '@/components/ClientDate';
import { format, formatDistanceToNow } from '@/lib/date-fp';
import { present, shortenDate, ACCESS_CTRL } from '@/lib/utils';
import { t } from '@/lib/i18n';
import type { RecentPicksItemProps } from '@/models/facts';
import {
  picksModeAtom,
  pickAtom,
  pickSavedAtom,
  refreshPickAtom,
} from './store';
import { errorsAtom, metaAtom } from '@/components/form/store';
import type { FieldErrors } from '@/components/form/store';
import { TextInput, Textarea, Select } from '@/components/form/Inputs';
import { ExclamationCircleIcon, CheckIcon, XMarkIcon, Square3Stack3DIcon, NoSymbolIcon } from '@heroicons/react/24/outline';

import { savePick } from '@/app/facts/save-pick';

const fieldName = R.partial(t, ['factFields']);

const tooltipCls = [
  'text-xs p-1 px-2 rounded box-border w-max max-w-[calc(100vw_-_10px)] z-[1002]',
  'bg-gradient-to-br from-stone-50 to-slate-100 ring-2 ring-offset-1 ring-slate-300',
].join(' ')

export function FormErrors({ errors }: { errors: FieldErrors}) {
  return (
    <div className='p-2 m-1 mt-3 rounded ring-1 ring-red-400 bg-red-300/50'>
      <div className='text-sm font-mono text-red-800 w-fit px-1 py-0 my-1 ring-1 ring-red-400 rounded bg-red-200 -mt-5 -ml-1'>
        Errors
      </div>
      <ul className='list-[square] list-inside'>
        {Object.entries(errors).map(([key, items]) => {
          return (
            <li key={key} className='mb-1'>
              <span className=''>
                {key === '_' ? '' : fieldName(key) }
              </span>
              <ul className='list-disc list-outside pl-5 text-xs'>
                {items.map((msg, idx) => <li key={idx}>{msg}</li>)}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StateTooltip() {
  return (
    <div className='text-sm p-2 px-2 ring-1 rounded box-border w-full bg-slate-100 shadow-lg leading-relaxed'>
      <strong>「草稿」</strong>
      狀態只有作者看得見，且不會留下修改記錄
      （但變更狀態時，仍會留記錄）。
      <br />
      公開後，仍然可以編輯回到草稿狀態。
    </div>
  );
}

function CancelButton({ onCancel }: {
  onCancel: (event: React.MouseEvent<HTMLButtonElement>) => void,
}) {
  return (
    <button className='btn bg-slate-100 ring-1 flex items-center hover:bg-white' onClick={onCancel}>
      <XMarkIcon className='stroke-red-700' height={20} />
      取消
    </button>
  );
}

function DateInfo({ id, publishedAt, createdAt, changes, changedAt }: {
  id?: number,
  publishedAt?: Date | null,
  createdAt?: Date | null,
  changes?: number,
  changedAt?: Date | null,
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    setNow(new Date());
  }, []);

  if (!id) return;

  const displayDate = publishedAt || createdAt;

  return (
    <>
      {
        displayDate &&
          <div className='flex items-center'>
            <Tooltip placement='bottom-start'>
              <TooltipTrigger className=''>
                <div className='mr-auto ml-3 whitespace-nowrap cursor-text'>
                  <ClientDate>
                    {shortenDate(displayDate, now)}
                  </ClientDate>
                </div>
              </TooltipTrigger>
              <TooltipContent className={`${tooltipCls} flex flex-col gap-y-1`}>
                <ClientDate>
                  { publishedAt && <div>發表日期：{ format({}, 'yyyy/MM/dd HH:mm', publishedAt) }</div> }
                  { createdAt   && <div>建立日期：{ format({}, 'yyyy/MM/dd HH:mm', createdAt ) }</div> }
                </ClientDate>
              </TooltipContent>
            </Tooltip>
          </div>
      }
      {
        (present(changes) && changedAt) &&
          <div className='ml-auto flex items-center'>
            已編輯：
            <Tooltip placement='bottom-start'>
              <TooltipTrigger className='mr-2 whitespace-nowrap cursor-text'>
                <div>
                  <ClientDate>
                    {formatDistanceToNow(changedAt).replace('大約', '').trim()}
                  </ClientDate>
                </div>
              </TooltipTrigger>
              <TooltipContent className={`${tooltipCls} font-mono`}>
                <ClientDate>
                  編輯日期：{ format({}, 'yyyy/MM/dd HH:mm', changedAt) }
                </ClientDate>
              </TooltipContent>
            </Tooltip>

            <Tooltip placement='bottom-start'>
              <TooltipTrigger className='flex items-center ml-auto'>
                <Link href={`/audit/picks/${id}`} className='inline-flex items-center justify-center p-1 ml-1 text-slate-500/75 hover:bg-purple-700/50 hover:text-white rounded-full' target='_blank'>
                  <Square3Stack3DIcon className='stroke-current' height={18} />
                  {changes}
                </Link>
              </TooltipTrigger>
              <TooltipContent className={`${tooltipCls}`}>調閱編修記錄（在新分頁開啟）</TooltipContent>
            </Tooltip>
          </div>
      }
    </>
  );
}

function UnscopedForm() {
  const setMeta = useSetAtom(metaAtom);
  const [errors, setErrors] = useAtom(errorsAtom);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pick, setPick] = useAtom(pickAtom);
  const setPicksMode = useSetAtom(picksModeAtom);
  const setSaved = useSetAtom(pickSavedAtom);
  const refresh = useSetAtom(refreshPickAtom);
  const { data: session, status } = useSession();

  useEffect(() => {
    setMeta({ fieldNameScope: 'factFields' });
  }, [setMeta]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!confirming) {
      return setConfirming(true);
    }

    const formData = new FormData(e.currentTarget);

    if (formData.get('id') === '0') {
      formData.delete('id');  // dirty work due to our schema shortage
    }

    setSending(true);
    const res = await savePick(formData);
    const item = res.item as RecentPicksItemProps;

    if (res.success && item) {
      setConfirming(false);
      setSending(false);
      setErrors({});
      setSaved(true);
      setPick(item);
      refresh(item);
      setPicksMode('my');
      return;
    }

    if (res.errors) {
      setErrors(res.errors);
    } else {
      setErrors({ '_': ['未知的錯誤'] });
    }
    setSending(false);
  };

  const cancel = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setPicksMode('my');
    setErrors({});
    setSaved(false);
  }, [setPicksMode, setErrors, setSaved]);

  if (!pick) {
    return;
  }

  const canSave = !sending;
  const canEdit = status === 'authenticated' && session.user.state === 'active';
  const userName = session?.user?.name;
  const isBanned = pick.state === 'dropped';

  if (ACCESS_CTRL !== 'open') {
    return (
      <>
        <h2 className='text-lg font-bold'>
          新的選集
        </h2>
        <div className='flex flex-col items-center gap-y-1 mt-3 mb-4'>
          <ExclamationCircleIcon className='stroke-yellow-700 animate-pulse size-16 stroke-2' height={24} />
          功能目前未開放
        </div>
      </>
    );
  }

  return (
    <>
      <h2 className='text-lg font-bold'>
        編輯選集
      </h2>
      <form onSubmit={onSubmit} className='flex flex-col items-center gap-y-1 mt-3'>
        <div className='grid grid-cols-[min-content_2fr] gap-y-2 mb-1'>
          <TextInput name='title' inputProps={{ required: true, className: 'cursor-text', defaultValue: pick.title || '', disabled: isBanned }} />
          <Textarea name='desc' inputProps={{ rows: 8, className: 'md:min-w-[500px] cursor-text', defaultValue: pick.desc || '', disabled: isBanned }} labelOpts={{ align: 'start' }} />
          {
            pick.state === 'dropped' ?
            <>
              <div>
                狀態
              </div>
              <div className='flex items-center'>
                <div className='mr-auto ml-3 whitespace-nowrap cursor-text'>
                  受網站管理處分
                </div>
                <DateInfo id={pick.id} publishedAt={pick.publishedAt} createdAt={pick.createdAt} changes={pick.changes} changedAt={pick.changedAt} />
              </div>
            </>
            :
            <Select name='state'
              inputProps={{ className: 'max-w-24', defaultValue: pick.state }}
              tooltip={<StateTooltip />}
              after={<DateInfo id={pick.id} publishedAt={pick.publishedAt} createdAt={pick.createdAt} changes={pick.changes} changedAt={pick.changedAt} />} >
              {
                ['draft', 'published'].map(o => (
                  <option key={o} value={o}>
                    {t('pickState', o)}
                  </option>
                ))
              }
            </Select>
          }
          <div className='text-nowrap'>作者</div>
          <div className='ml-2 p-1 py-px flex-1'>
            {userName || '--'}
          </div>
          <div className='text-nowrap'>筆數</div>
          <div className='ml-2 p-1 py-px flex-1'>
            {pick.factIds?.length || ''}
          </div>
        </div>

        <input type='hidden' name='factIds' value={JSON.stringify(pick.factIds)} />
        <input type='hidden' name='id' value={pick.id} />

        {R.isNotEmpty(errors) && <FormErrors errors={errors} />}

        {confirming &&
          <div className='p-2 m-1 mb-3 rounded ring-4 ring-yellow-400 bg-gradient-to-br from-amber-200 to-yellow-300 text-balance flex items-center gap-x-2'>
            <ExclamationCircleIcon className='stroke-yellow-700 animate-pulse size-16 stroke-2' height={24} />
            <div className='flex flex-col'>
              即將送出資料

              <ol className='list-decimal list-inside mt-1'>
                <li>
                  狀態若為<strong>公開</strong>，修改就會留下記錄
                </li>
                <li>
                  經管理人判斷不當的資料可能被刪除
                </li>
              </ol>
            </div>
          </div>
        }

        {
          isBanned ?
            <div className='flex items-center justify-center w-full gap-x-2 mt-2 mb-1 font-bold'>
              <NoSymbolIcon className='' height={18} />
              此項目管制中，不能編輯
            </div>
          :
            <div className='flex items-center justify-center w-full gap-x-2 mt-2 mb-1 text-sm'>
              <button className='btn bg-slate-100 ring-1 flex items-center hover:bg-white' disabled={!canSave}>
                <CheckIcon className='stroke-green-700' height={20} />
                {sending ? '處理中……' :
                  confirming ? '確認送出' : '儲存'
                }
              </button>
              <CancelButton onCancel={cancel} />
            </div>
        }
      </form>
    </>
  );
}

export default function PickForm() {
  return (
    <ScopeProvider atoms={[errorsAtom, metaAtom]}>
      <UnscopedForm />
    </ScopeProvider>
  );
}
