"use client"

import * as R from 'ramda';
import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';
import { ScopeProvider } from 'jotai-scope'
import { CheckIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import PartyPopperIcon from '@/assets/party-popper.svg';

import { SpotActionEnum } from '@/lib/schema';
import { t } from '@/lib/i18n';
import { ariaDatePickerValueFix } from '@/lib/utils';
import ActionLabel from '@/app/world/[[...path]]/ActionLabel';
import FormConfirm from '@/app/world/[[...path]]/FormConfirm';
import { createSpot } from '@/app/world/[[...path]]/create-spot';
import { errorsAtom, metaAtom } from '@/components/form/store';
import { addAlertAtom } from '@/components/store';
import type { MarkerProps } from '@/components/map/TempMarker';
import type { FieldErrors } from '@/components/form/store';
import { TextInput, Textarea, Select } from '@/components/form/Inputs';
import { DateTimeField } from '@/components/form/DateTimeField';
import { parseAbsoluteToLocal } from '@internationalized/date';

const fieldName = R.partial(t, ['spotFields']);

export const spotActionTooltip = (
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

export const spawnedAtTooltip = (
  <div className="p-2 px-2 ring-1 rounded box-border w-full bg-slate-100 shadow-lg">
    推測放下食物的時間。<br />
    發現「新一次的餵食」才要填寫，<br />
    其他跟進請留空
  </div>
);

function SimpleTooltip({ text }: {
  text: string
}) {
  return (
    <p className="p-2 px-2 ring-1 rounded box-border w-full bg-slate-100 shadow-lg">{text}</p>
  );
}

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

function SuccessAlert() {
  return (
    <div className='flex flex-col text-center leading-8 gap-3'>
      <div>新增地點<span className='text-green-900'>完成</span></div>
      <div className='flex items-center'>
        <PartyPopperIcon className='mr-2 stroke-rose-600 fill-white' width={25} height={25} aria-label='太棒了' />
        感謝<span className='italic'>！</span>
      </div>
    </div>
  )
};

type FormProps = {
  lat: number,
  lon: number,
  defaultDate?: Date,
} & MarkerProps;

function UnscopedForm({
  lat,
  lon,
  markerAtom,
  editingFormAtom,
  mergeSpotsAtom,
  defaultDate,
}: FormProps) {
  const setEditingForm = useSetAtom(editingFormAtom);
  const setTempMarker = useSetAtom(markerAtom);
  const reloadSpots = useSetAtom(mergeSpotsAtom);
  const setMeta = useSetAtom(metaAtom);
  const [errors, setErrors] = useAtom(errorsAtom);
  const [sending, setSending] = useState(false);
  const [action, setAction] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [pickerKey, setPickerKey] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const addAlert = useSetAtom(addAlertAtom);

  useEffect(() => {
    setNow(new Date());
    setMeta({ fieldNameScope: 'spotFields' });
  }, [setMeta]);

  useEffect(() => {
    setPickerKey(R.inc);  // ensure DatePicker value reset
  }, [defaultDate]);

  const onActionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setAction(e.currentTarget.value);
  }, []);

  const cancel = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setErrors({});
    setEditingForm('');
    setTempMarker({ visible: false });
  }, [setErrors, setEditingForm, setTempMarker]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!confirming) {
      return setConfirming(true);
    }

    const formData = new FormData(e.currentTarget);

    ariaDatePickerValueFix(formData, ['removedAt', 'spawnedAt']);

    setSending(true);
    const res = await createSpot(formData);

    if (res.success) {
      setSending(false);
      reloadSpots(res.reloadSpots);
      setEditingForm('');
      setTempMarker({ visible: false });
      addAlert('info', <SuccessAlert />);
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
  const defaultDateValue = defaultDate ? parseAbsoluteToLocal(defaultDate.toISOString()) : nowValue;

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
            <DateTimeField name='removedAt' key={`${pickerKey}_r`} defaultValue={defaultDateValue} maxValue={nowValue} />
        }

        <Textarea name='desc' />
        <TextInput name='material' inputProps={{ placeholder: '例：狗罐頭' }} />
        <TextInput name='feedeeCount' type='number' tooltip={<SimpleTooltip text='同時出現的狗群隻數' />} inputProps={{ min: 0, max: 99, defaultValue: 0 }} />

        <DateTimeField name='spawnedAt' key={pickerKey} defaultValue={defaultDateValue} maxValue={nowValue} tooltip={spawnedAtTooltip} />

        <input type='hidden' name='lat' value={lat} />
        <input type='hidden' name='lon' value={lon} />
      </div>

      {R.isNotEmpty(errors) && <FormErrors errors={errors} />}

      {confirming && <FormConfirm />}

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

export default function Form(props: FormProps) {
  return (
    <ScopeProvider atoms={[errorsAtom, metaAtom]}>
      <UnscopedForm {...props} />
    </ScopeProvider>
  );
}
