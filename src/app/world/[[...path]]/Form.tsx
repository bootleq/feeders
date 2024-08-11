"use client"

import * as R from 'ramda';
import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';
import { ScopeProvider } from 'jotai-scope'
import { CheckIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';

import { SpotActionEnum } from '@/lib/schema';
import { t } from '@/lib/i18n';
import { mergeTempMarkerAtom, editingFormAtom, mergeSpotsAtom } from '@/app/world/[[...path]]/store';
import ActionLabel from '@/app/world/[[...path]]/ActionLabel';
import { createSpot } from '@/app/world/[[...path]]/create-spot';
import { errorsAtom, metaAtom } from '@/components/form/store';
import type { FieldErrors } from '@/components/form/store';
import { TextInput, Textarea, Select } from '@/components/form/Inputs';
import { DateTimeField } from '@/components/form/DateTimeField';
import { parseAbsoluteToLocal } from '@internationalized/date';

const fieldName = R.partial(t, ['spotFields']);

const spotActionTooltip = (
  <ul className="p-2 px-2 ring-1 rounded box-border w-full bg-slate-100 shadow-lg">
    {SpotActionEnum.options.map(o => {
      return (<li key={o} className='flex items-start py-1 hover:bg-slate-200/75'>
        <div className='whitespace-nowrap min-w-[3.85rem] text-center'>
          <ActionLabel action={o} className='mr-1 min-w-5 block' />
        </div>
        <p className='text-sm break-all'>
          {t('spotActionDesc', o)}
        </p>
      </li>);
    })}
  </ul>
);

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

export function UnscopedForm({ lat, lon }: {
  lat: number,
  lon: number,
}) {
  const setEditingForm = useSetAtom(editingFormAtom);
  const setTempMarker = useSetAtom(mergeTempMarkerAtom);
  const reloadSpots = useSetAtom(mergeSpotsAtom);
  const setMeta = useSetAtom(metaAtom);
  const [errors, setErrors] = useAtom(errorsAtom);
  const [sending, setSending] = useState(false);
  const [action, setAction] = useState('');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setNow(new Date());
    setMeta({ fieldNameScope: 'spotFields' });
  }, [setMeta]);

  const onActionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setAction(e.currentTarget.value);
  }, []);

  const cancel = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setErrors({});
    setEditingForm('');
  }, [setErrors, setEditingForm]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setSending(true);
    const res = await createSpot(formData);

    if (res.success) {
      setSending(false);
      reloadSpots(res.reloadSpots);
      setEditingForm('');
      setTempMarker({ visible: false });
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
        <TextInput name='spotTitle' inputProps={{placeholder: '例：道路反射鏡下', required: true}} />
        <Textarea name='spotDesc' />

        <div className='col-span-2'>
          <hr className='w-11/12 h-px mx-auto my-5 bg-gray-200 border-0 dark:bg-gray-700' />
          <span className='block mx-auto -mt-[1.9rem] mb-2 px-3 w-min whitespace-nowrap bg-white text-sm text-center text-slate-500'>
            初次發現狀況
          </span>
        </div>

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
        <DateTimeField name='spawnedAt' defaultValue={nowValue} maxValue={nowValue} tooltip={<SimpleTooltip text='推測放下食物的時間' />} />

        <input type='hidden' name='lat' value={lat} />
        <input type='hidden' name='lon' value={lon} />
      </div>

      {R.isNotEmpty(errors) && <FormErrors errors={errors} />}

      <div className='p-2 m-1 rounded ring-1 ring-yellow-400 bg-yellow-300/50 text-center text-balance'>
        資料將會公開，修改會留下記錄，請避免洩漏私人資訊。
      </div>

      <div className='flex items-center justify-center w-full gap-x-2 mt-2 mb-1 text-sm'>
        <button className='btn bg-slate-100 ring-1 flex items-center hover:bg-white' disabled={!canSave}>
          <CheckIcon className='stroke-green-700' height={20} />
          {sending ? '處理中……' : '儲存'}
        </button>
        <button className='btn bg-slate-100 ring-1 flex items-center hover:bg-white' onClick={cancel}>
          <XMarkIcon className='stroke-red-700' height={20} />
          取消
        </button>
      </div>
    </form>
  );
}

export default function Form({ lat, lon }: {
  lat: number,
  lon: number,
}) {
  return (
    <ScopeProvider atoms={[errorsAtom, metaAtom]}>
      <UnscopedForm lat={lat} lon={lon} />
    </ScopeProvider>
  );
}
