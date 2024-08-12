"use client"

import * as R from 'ramda';
import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';
import { ScopeProvider } from 'jotai-scope'
import { CheckIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

import { SpotActionEnum } from '@/lib/schema';
import { t } from '@/lib/i18n';
import { ariaDatePickerValueFix } from '@/lib/utils';
import { editingFormAtom, mergeSpotsAtom } from '@/app/world/[[...path]]/store';
import ActionLabel from '@/app/world/[[...path]]/ActionLabel';
import { createFollowup } from '@/app/world/[[...path]]/create-followup';
import { errorsAtom, metaAtom } from '@/components/form/store';
import type { FieldErrors } from '@/components/form/store';
import { TextInput, Textarea, Select } from '@/components/form/Inputs';
import { DateTimeField } from '@/components/form/DateTimeField';
import { parseAbsoluteToLocal } from '@internationalized/date';
import { spotActionTooltip, spawnedAtTooltip } from './Form';

const fieldName = R.partial(t, ['spotFields']);

function SimpleTooltip({ text }: {
  text: string
}) {
  return (
    <p className="p-2 px-2 ring-1 rounded box-border w-full bg-slate-100 shadow-lg">{text}</p>
  );
}

function FormErrors({ errors }: { errors: FieldErrors}) {
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

export function UnscopedForm({ spotId, geohash }: {
  spotId: number,
  geohash: string,
}) {
  const setEditingForm = useSetAtom(editingFormAtom);
  const reloadSpots = useSetAtom(mergeSpotsAtom);
  const setMeta = useSetAtom(metaAtom);
  const [errors, setErrors] = useAtom(errorsAtom);
  const [sending, setSending] = useState(false);
  const [action, setAction] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setNow(new Date());
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
    const res = await createFollowup(formData);

    if (res.success) {
      setSending(false);
      reloadSpots(res.reloadSpots);
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

  return (
    <form onSubmit={onSubmit} className='flex flex-col items-center gap-y-1 mt-3'>
      <div className='grid grid-cols-[min-content_2fr] gap-y-2 mb-1'>
        <Select name='action' tooltip={spotActionTooltip} inputProps={{ onChange: onActionChange }}>
          { SpotActionEnum.options.map(o => (
            <option key={o} value={o}>
              {t('spotAction', o)}
            </option>)
          )}
        </Select>
        {
          action === 'remove' &&
            <DateTimeField name='removedAt' defaultValue={nowValue} maxValue={nowValue} />
        }

        <Textarea name='desc' />
        <TextInput name='material' inputProps={{ placeholder: '例：狗罐頭' }} />
        <TextInput name='feedeeCount' type='number' tooltip={<SimpleTooltip text='同時出現的狗群隻數' />} inputProps={{ min: 0, max: 99, defaultValue: 0 }} />

        <DateTimeField name='spawnedAt' maxValue={nowValue} tooltip={spawnedAtTooltip} />

        <input type='hidden' name='spotId' value={spotId} />
        <input type='hidden' name='geohash' value={geohash} />
      </div>

      {R.isNotEmpty(errors) && <FormErrors errors={errors} />}

      {confirming &&
        <div className='p-2 m-1 rounded ring-4 ring-yellow-400 bg-gradient-to-br from-amber-200 to-yellow-300 text-center text-balance flex items-center'>
          <ExclamationCircleIcon className='stroke-yellow-700 animate-pulse size-16 stroke-2' height={24} />
          資料即將公開，修改也會留下記錄，請避免洩漏私人資訊
        </div>
      }

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
  );
}

export default function FollowupForm({ spotId, geohash }: {
  spotId: number,
  geohash: string,
}) {
  return (
    <ScopeProvider atoms={[errorsAtom, metaAtom]}>
      <UnscopedForm spotId={spotId} geohash={geohash} />
    </ScopeProvider>
  );
}
