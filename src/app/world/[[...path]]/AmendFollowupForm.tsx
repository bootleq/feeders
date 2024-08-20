"use client"

import * as R from 'ramda';
import { useState, useEffect, useCallback } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { ScopeProvider } from 'jotai-scope'
import { CheckIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ArrowsUpDownIcon } from '@heroicons/react/24/outline';

import { SpotActionEnum } from '@/lib/schema';
import { t } from '@/lib/i18n';
import { ariaDatePickerValueFix } from '@/lib/utils';
import { mergeTempMarkerAtom, editingFormAtom, mergeSpotFollowupsAtom } from '@/app/world/[[...path]]/store';
import { amendFollowup } from '@/app/world/[[...path]]/amend-followup';
import { errorsAtom, metaAtom } from '@/components/form/store';
import type { GeoSpotsResultFollowup } from '@/models/spots';
import { TextInput, Textarea, Select } from '@/components/form/Inputs';
import { DateTimeField } from '@/components/form/DateTimeField';
import { parseAbsoluteToLocal, fromDate, getLocalTimeZone } from '@internationalized/date';
import { spotActionTooltip, spawnedAtTooltip, FormErrors } from './Form';

function SimpleTooltip({ text }: {
  text: string
}) {
  return (
    <p className="p-2 px-2 ring-1 rounded box-border w-full bg-slate-100 shadow-lg">{text}</p>
  );
}

export function UnscopedForm({ item }: {
  item: GeoSpotsResultFollowup,
}) {
  const setEditingForm = useSetAtom(editingFormAtom);
  const reload = useSetAtom(mergeSpotFollowupsAtom);
  const setMeta = useSetAtom(metaAtom);
  const [errors, setErrors] = useAtom(errorsAtom);
  const [sending, setSending] = useState(false);
  const [action, setAction] = useState<string>(item.action);
  const [now, setNow] = useState(() => new Date());
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setMeta({ fieldNameScope: 'spotFields' });
  }, [setMeta]);

  const onActionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setAction(e.currentTarget.value);
  }, []);

  const cancel = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setErrors({});
    setEditingForm('');
  }, [setErrors, setEditingForm]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!confirming) {
      return setConfirming(true);
    }

    const formData = new FormData(e.currentTarget);
    ariaDatePickerValueFix(formData, ['removedAt', 'spawnedAt']);

    setSending(true);
    const res = await amendFollowup(formData);

    if (res.success) {
      setSending(false);
      reload([res.spotId!, res.reloadFollowups]);
      setEditingForm('');
      return;
    }

    if (res.errors) {
      setErrors(res.errors);
      // console.log('failed', res);
    } else {
      setErrors({ '_': ['未知的錯誤'] });
      // console.log('failed', res);
    }
    setSending(false);
  };

  const canSave = !sending;
  const nowValue = parseAbsoluteToLocal(now.toISOString());
  const defaultRemovedAt = item.removedAt ? fromDate(item.removedAt, getLocalTimeZone()) : null;
  const defaultSpawnedAt = item.spawnedAt ? fromDate(item.spawnedAt, getLocalTimeZone()) : null;

  return (
    <>
      <div className='flex items-center ml-2 mr-auto translate-y-0.5 px-1 w-min whitespace-nowrap text-white text-sm bg-purple-800 font-bold ring-2 ring-purple-400/75'>
        修訂
        <ArrowsUpDownIcon className='stroke-current' height={18} />
      </div>
      <form onSubmit={onSubmit} className='flex flex-col items-center gap-y-1 -mt-1 ml-1 pt-3 pb-2 px-1 text-sm ring-2 ring-offset-1 ring-purple-400/75 bg-pink-100/75 rounded-lg'>
        <div className='grid grid-cols-[min-content_2fr] gap-y-2 mb-1'>
          <Select name='action' tooltip={spotActionTooltip} inputProps={{ onChange: onActionChange, defaultValue: item.action, className: 'text-sm' }}>
            { SpotActionEnum.options.map(o => (
              <option key={o} value={o}>
                {t('spotAction', o)}
              </option>)
            )}
          </Select>
          {
            action === 'remove' &&
              <DateTimeField name='removedAt' defaultValue={defaultRemovedAt} maxValue={nowValue} />
          }

          <Textarea name='desc' inputProps={{ defaultValue: item.desc || '', className: 'text-sm' }} />
          <TextInput name='material' inputProps={{ placeholder: '例：狗罐頭', defaultValue: item.material || '', className: 'text-sm' }} />
          <TextInput
            name='feedeeCount' type='number' tooltip={<SimpleTooltip text='同時出現的狗群隻數' />}
            inputProps={{ min: 0, max: 99, defaultValue: item.feedeeCount || 0, className: 'text-sm' }} />

          <DateTimeField name='spawnedAt' defaultValue={defaultSpawnedAt} maxValue={nowValue} tooltip={spawnedAtTooltip} dateInputClass='text-sm mr-1' />

          <input type='hidden' name='id' value={item.id} />
        </div>

        {R.isNotEmpty(errors) && <FormErrors errors={errors} />}

        <div className='flex items-center justify-center w-full gap-x-2 mt-2 mb-1 text-sm'>
          <button className='btn bg-slate-100 ring-1 flex items-center hover:bg-white' disabled={!canSave}>
            <CheckIcon className='stroke-green-700' height={20} />
            {sending ? '處理中……' :
              confirming ? '確認送出' : '儲存'
            }
          </button>
          <button className='btn bg-slate-100 ring-1 flex items-center hover:bg-white' onClick={cancel}>
            <XMarkIcon className='stroke-red-700' height={20} />
            取消
          </button>
        </div>
      </form>
    </>
  );
}

export default function Form({ followup }: {
  followup: GeoSpotsResultFollowup,
}) {
  return (
    <ScopeProvider atoms={[errorsAtom, metaAtom]}>
      <UnscopedForm item={followup} />
    </ScopeProvider>
  );
}
