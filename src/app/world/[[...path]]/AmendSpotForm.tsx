"use client"

import * as R from 'ramda';
import { useState, useEffect, useCallback } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { ScopeProvider } from 'jotai-scope'
import { CheckIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ArrowsUpDownIcon } from '@heroicons/react/24/outline';

import { mergeTempMarkerAtom, editingFormAtom, mergeSpotsAtom } from '@/app/world/[[...path]]/store';
import { amendSpot } from '@/app/world/[[...path]]/amend-spot';
import { errorsAtom, metaAtom } from '@/components/form/store';
import type { GeoSpotsResultSpot } from '@/models/spots';
import { TextInput, Textarea } from '@/components/form/Inputs';
import { FormErrors } from './Form';

export function UnscopedForm({ spot }: {
  spot: GeoSpotsResultSpot
}) {
  const setEditingForm = useSetAtom(editingFormAtom);
  const reloadSpots = useSetAtom(mergeSpotsAtom);
  const setMeta = useSetAtom(metaAtom);
  const [errors, setErrors] = useAtom(errorsAtom);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setMeta({ fieldNameScope: 'spotFields' });
  }, [setMeta]);

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

    setSending(true);
    const res = await amendSpot(formData);

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

  return (
    <>
      <div className='flex items-center ml-1 mr-auto translate-y-0.5 px-1 w-min whitespace-nowrap text-white text-sm bg-purple-800 font-bold ring-2 ring-purple-400/75'>
        修訂
        <ArrowsUpDownIcon className='stroke-current' height={18} />
      </div>
      <form onSubmit={onSubmit} className='flex flex-col items-center gap-y-1 -mt-1 pt-3 pb-2 ring ring-offset-2 ring-purple-400/75 bg-pink-100/75 rounded-lg'>
        <div className='grid grid-cols-[min-content_2fr] gap-y-2 mb-1'>
          <TextInput name='spotTitle' inputProps={{ required: true, defaultValue: spot.title || '' }} />
          <TextInput name='lat' inputProps={{ required: true, defaultValue: spot.lat || '', className: 'font-mono', readOnly: false }} />
          <TextInput name='lon' inputProps={{ required: true, defaultValue: spot.lon || '', className: 'font-mono', readOnly: false }} />
          <Textarea name='spotDesc' inputProps={{ defaultValue: spot.desc || ''}} />

          <input type='hidden' name='id' value={spot.id} />
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

export default function Form({ spot }: {
  spot: GeoSpotsResultSpot
}) {
  return (
    <ScopeProvider atoms={[errorsAtom, metaAtom]}>
      <UnscopedForm spot={spot} />
    </ScopeProvider>
  );
}
