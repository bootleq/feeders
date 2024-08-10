"use client"

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';
import { CheckIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';

import { SpotActionEnum } from '@/lib/schema';
import { t } from '@/lib/i18n';
import { editingFormAtom } from '@/app/world/[[...path]]/store';
import ActionLabel from '@/app/world/[[...path]]/ActionLabel';
import { TextInput, Textarea, Select } from '@/components/form/Inputs';
import { DateTimeField } from '@/components/form/DateTimeField';
import { parseAbsoluteToLocal } from '@internationalized/date';

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

export default function Form({}: {
}) {
  const setEditingForm = useSetAtom(editingFormAtom);
  const [sending, setSending] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setNow(new Date());
  }, []);

  const cancel = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setEditingForm('');
  }, [setEditingForm]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData();

    setSending(true);
    // const res = await save(formData);
    setSending(false);
  };

  const canSave = !sending;
  const nowValue = parseAbsoluteToLocal(now.toISOString());

  return (
    <form onSubmit={onSubmit} className='flex flex-col items-center gap-y-1 mt-3'>
      <div className='grid grid-cols-[min-content_2fr] gap-y-2 mb-1'>
        <TextInput label='地點簡稱' name='spotTitle' inputProps={{placeholder: '例：道路反射鏡下', required: true}} />
        <Textarea label='地點說明' name='spotDesc' />

        <div className='col-span-2'>
          <hr className='w-11/12 h-px mx-auto my-5 bg-gray-200 border-0 dark:bg-gray-700' />
          <span className='block mx-auto -mt-[1.9rem] mb-2 px-3 w-min whitespace-nowrap bg-white text-sm text-center text-slate-500'>
            初次發現狀況
          </span>
        </div>

        <Select label='行動' name='action' tooltip={spotActionTooltip}>
          { SpotActionEnum.options.map(o => (
            <option key={o} value={o}>
              {t('spotAction', o)}
            </option>)
          )}
        </Select>
        <Textarea label='說明' name='desc' />
        <TextInput label='食物內容' name='material' inputProps={{ placeholder: '例：狗罐頭' }} />
        <TextInput label='狗群數量' name='feedeeCount' type='number' tooltip={<SimpleTooltip text='同時出現的狗群隻數' />} inputProps={{ min: 0, max: 99 }} />
        <DateTimeField label='生成時間' name='spawnedAt' defaultValue={nowValue} maxValue={nowValue} tooltip={<SimpleTooltip text='推測放下食物的時間' />} />
        <DateTimeField label='移除時間' name='removedAt' maxValue={nowValue} />
      </div>

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
