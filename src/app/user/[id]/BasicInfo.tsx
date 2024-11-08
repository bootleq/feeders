"use client"

import * as R from 'ramda';
import { useEffect, useRef, useState, useCallback } from 'react';
import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';
import { ACCESS_CTRL, ENABLE_ACTIVATE } from '@/lib/utils';
import { format } from '@/lib/date-fp';
import { differenceInDays } from 'date-fns';
import { t } from '@/lib/i18n';
import { RENAME_COOL_OFF_DAYS } from '@/models/users';
import type { WorldUserResult, ProfileResult } from '@/models/users';
import UserAgreement from '@/app/user/UserAgreement';
import { inputCls } from '@/components/form/Inputs';
import Alerts from '@/components/Alerts';
import ClientDate from '@/components/ClientDate';
import { alertsAtom, addAlertAtom, dismissAlertAtom } from '@/components/store';
import activate from './activate';
import updateUser from './update-user';
import Spinner from '@/assets/spinner.svg';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';
import { Popover, PopoverTrigger, PopoverContent, PopoverClose } from '@/components/Popover';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

const tinyBtnCls = 'btn p-px ml-1 ring-1 flex items-center hover:bg-slate-100';
const tooltipCls = [
  'text-xs p-1 px-2 rounded box-border w-max max-w-[calc(100vw_-_10px)] z-[1002]',
  'bg-gradient-to-br from-stone-50 to-slate-100 ring-2 ring-offset-1 ring-slate-300',
].join(' ')
const dialogCls = [ // NOTE: the -translate-x must take care of Sidebar position / width
  'fixed top-1/2 left-1/2 transform -translate-x-1/2 sm:-translate-x-full -translate-y-1/2',
  'z-[2000] w-max p-4 mt-2 sm:mt-auto rounded-lg md:shadow-lg',
  'bg-gradient-to-br from-stone-50 to-slate-200 backdrop:bg-black/50',
].join(' ');

export default function UserInfo({ user, profile }: {
  user: WorldUserResult | null,
  profile: ProfileResult | null,
}) {
  const [editName, setEditName] = useState(false);
  const [editDesc, setEditDesc] = useState(false);
  const [confirmingRename, setConfirmingRename] = useState(false);
  const [activating, setActivating] = useState(false);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coolingOff, setCoolingOff] = useState(false);
  const activateDialogRef = useRef<HTMLDialogElement>(null);
  const renameFormRef = useRef<HTMLFormElement>(null);
  const addAlert = useSetAtom(addAlertAtom);

  const toggleEditName = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setEditName(R.not);
    if (confirmingRename) setConfirmingRename(false);
  }, [confirmingRename]);

  const toggleEditDesc = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setEditDesc(R.not);
  }, []);

  const updateName = useCallback(async (e: React.FormEvent<HTMLFormElement> | null) => {
    e && e.preventDefault();

    const form = renameFormRef.current;
    if (!form) return;

    form.submit(); // dual submit to noop

    const formData = new FormData(form);

    formData.set('value', (formData.get('userAlias') || '').toString());
    formData.delete('userAlias');

    setSending(true);
    try {
      const res = await updateUser(formData);
      if (res.success) {
        setEditName(false);
        return;
      }
      addAlert('error', res.error ? <>{res.error}</> : <>未知的錯誤</>);
    } catch (e) {
      addAlert('error', <>非預期的錯誤</>);
    } finally {
      setSending(false);
    }
  }, [setSending, addAlert]);

  const updateDesc = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    formData.set('value', (formData.get('desc') || '').toString());
    formData.delete('desc');

    setSending(true);
    try {
      const res = await updateUser(formData);
      if (res.success) {
        setEditDesc(false);
        return;
      }
      addAlert('error', res.error ? <>{res.error}</> : <>未知的錯誤</>);
    } catch (e) {
      addAlert('error', <>非預期的錯誤</>);
    } finally {
      setSending(false);
    }
  }, [setSending, addAlert]);

  const confirmRename = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (confirmingRename) {
      const form = renameFormRef.current;
      if (form) {
        await updateName(null);
      }
    } else {
      setConfirmingRename(true);
    }
  }, [setConfirmingRename, confirmingRename, updateName]);

  const startActivate = useCallback(() => {
    const dialog = activateDialogRef.current;
    if (dialog) {
      dialog.showModal();
      const btn = dialog.querySelector('button[value="cancel"]') as HTMLButtonElement;
      btn && btn.focus();
    }
  }, []);

  const cancelActivate = useCallback(() => {
    const dialog = activateDialogRef.current;
    if (dialog) dialog.close();
  }, []);

  const onActivate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const dialog = activateDialogRef.current;
    if (!dialog) return;

    setActivating(true);
    try {
      const res = await activate();
      if (res.success) {
        dialog.close();
        // server action should do revalidatePath
      } else {
        dialog.close();
        addAlert('error', <>{res.error}</> || <>未知的錯誤</>);
      }
      setActivating(false);
    } catch (e) {
      dialog.close();
      addAlert('error', <>非預期的錯誤</>);
    }
    setActivating(false);
  }, [addAlert]);

  useEffect(() => {
    if (!profile?.renames) return;
    const renameAt = new Date(profile.renames[0].time);
    const dayDiff = renameAt ? differenceInDays(new Date(), renameAt) : -1;
    setCoolingOff(renameAt && dayDiff < RENAME_COOL_OFF_DAYS);
  }, [profile, setCoolingOff]);

  if (!profile) {
    return null;
  }

  const isCurrentUser = user && user.id === profile.id;
  const waitingActivate = isCurrentUser && user.state === 'new';
  const canEdit = ACCESS_CTRL === 'open' && isCurrentUser && user.state === 'active';
  const canRename = canEdit && !coolingOff;
  const anyEditing = editName || editDesc;

  return (
    <>
      <div className='flex items-center flex-wrap gap-x-3 gap-y-3 h-full'>
        <div className='grid grid-cols-[min-content_2fr] w-fit min-w-[300px] max-w-[90vw] md:max-w-screen-sm items-center gap-x-4 px-4'>
          <div className='whitespace-nowrap py-1'>名稱</div>
          {editName ?
            <div className='flex items-center gap-x-1'>
              <form ref={renameFormRef} action='/api/noop' method='POST' onSubmit={confirmRename} target='noop-trap'>
                <input type='text' name='userAlias' autoFocus required defaultValue={profile.name || ''} className={`${inputCls} ml-0 w-36 box-border`} />
                <input type='hidden' name='field' value='name' />
              </form>

              <Popover open={confirmingRename}>
                <PopoverTrigger>
                  <button aria-label='確認' className={tinyBtnCls} onClick={() => setConfirmingRename(R.not)}>
                    <CheckIcon className='stroke-green-600' height={20} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className='flex flex-col items-center p-2 py-3 w-[clamp(1%,15rem,95%)] gap-y-1 bg-slate-100 ring-1 rounded-lg text-balance'>
                  <div className='mb-2 text-balance text-center'>
                    為避免辨識困難，<strong className='text-red-600'>每 {RENAME_COOL_OFF_DAYS} 天只能改名一次</strong>，確定要繼續嗎？
                  </div>
                  <form onSubmit={updateName}>
                    <button className='btn py-px mb-1 bg-slate-100 ring-1 flex items-center hover:bg-white' disabled={sending}>
                      {sending ? '處理中……' : '確認'}
                    </button>
                  </form>
                </PopoverContent>
              </Popover>

              <button aria-label='取消' className={tinyBtnCls} onClick={toggleEditName}>
                <XMarkIcon className='stroke-red-500' height={20} />
              </button>
            </div>
            :
            <div className='flex items-center ml-2 gap-x-1'>
              { profile.name || '--'}
              {canEdit && canRename &&
                <Tooltip>
                  <TooltipTrigger>
                    <button className={tinyBtnCls} onClick={toggleEditName} disabled={anyEditing}>
                      <PencilSquareIcon className='stroke-current' height={20} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className={tooltipCls}>編輯</TooltipContent>
                </Tooltip>
              }
            </div>
          }

          <div className='whitespace-nowrap py-1'>狀態</div>
          <div className='flex items-center ml-2'>
            { t('userStates', profile.state) }
            {waitingActivate && (
              ENABLE_ACTIVATE === 'on' ?
                <button type='button' onClick={startActivate} className='btn ring-1 ml-auto bg-gradient-to-br from-yellow-100 to-yellow-200 shadow-lg'>
                  啟用帳號
                </button>
              :
              <p className='text-red-800 text-sm ml-3 p-2 rounded bg-red-300 shadow-lg'>
                暫不開放自動啟用
              </p>
            )}
          </div>

          <div className='whitespace-nowrap py-1'>建立時間</div>
          <div className='font-mono ml-2'>
            <ClientDate fallback='--'>
              {format({}, 'yyyy/MM/dd', profile.createdAt)}
            </ClientDate>
          </div>

          <div className='whitespace-nowrap py-1 self-start'>介紹</div>
          {editDesc ?
            <form onSubmit={updateDesc} className='flex flex-col items-center gap-x-1'>
              <div>
                <textarea name='desc' autoFocus cols={36} rows={8} className={`${inputCls} resize`}>
                  {profile.desc}
                </textarea>
                <input type='hidden' name='field' value='desc' />
              </div>

              <div className='flex items-center self-end gap-x-1 mt-1'>
                <button aria-label='確認' className={tinyBtnCls}>
                  {sending ? '處理中……' : <CheckIcon className='stroke-green-600' height={20} />}
                </button>
                <button aria-label='取消' className={tinyBtnCls} onClick={toggleEditDesc}>
                  <XMarkIcon className='stroke-red-500' height={20} />
                </button>
              </div>
            </form>
            :
            <div className='flex items-center ml-2 gap-x-1 whitespace-break-spaces'>
              <div className='p-1 my-2 mr-2 text-sm ring-1 ring-slate-500/50 rounded max-h-60 overflow-auto scrollbar-thin'>
                { profile.desc }
              </div>
              {canEdit &&
                <Tooltip>
                  <TooltipTrigger>
                    <button className={tinyBtnCls} onClick={toggleEditDesc} disabled={anyEditing}>
                      <PencilSquareIcon className='stroke-current' height={20} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className={tooltipCls}>編輯</TooltipContent>
                </Tooltip>
              }
            </div>
          }
        </div>
      </div>

      {waitingActivate &&
        <dialog ref={activateDialogRef} role='dialog' aria-modal className={dialogCls}>
          <UserAgreement />
          <hr className='w-11/12 h-px mx-auto my-5 bg-slate-400/75 border-0' />
          <form onSubmit={onActivate} className='flex flex-col items-center justify-center w-fit mx-auto mb-2'>
            <button className='btn py-2 text-balance flex items-center hover:bg-white mb-1 hover:ring-inset hover:ring-1 hover:ring-slate-400' disabled={activating}>
              {activating ?
                <Spinner className='' width={24} height={24} aria-label='讀取中' />
                :
                <>
                  <CheckIcon className='stroke-current' height={20} />
                  同意，啟用我的帳號（不可以反悔！）
                </>
              }
            </button>

            <button type='button' value='cancel' onClick={cancelActivate} className='btn py-2 flex items-center hover:bg-white self-stretch hover:ring-inset hover:ring-1 hover:ring-slate-400'>
              <XMarkIcon className='stroke-current' height={20} />
              取消
            </button>
          </form>
        </dialog>
      }

      <Alerts itemsAtom={alertsAtom} dismissAtom={dismissAlertAtom} />
      <iframe name='noop-trap' className='hidden' />
    </>
  );
}
