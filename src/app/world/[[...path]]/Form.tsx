"use client"

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';
import { CheckIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';

import { editingFormAtom } from '@/app/world/[[...path]]/store';
import { Input, Textarea } from '@/components/form/Input';

export default function Form({}: {
}) {
  const setEditingForm = useSetAtom(editingFormAtom);
  const [sending, setSending] = useState(false);

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

  return (
    <form onSubmit={onSubmit} className='flex flex-col items-center gap-y-1 mt-4'>
      <div className='grid grid-cols-[min-content_2fr] gap-y-2'>
        <Input label='地點簡稱' name='spotTitle' inputProps={{placeholder: '例：道路反射鏡下'}} />
        <Textarea label='說明' name='spotDesc' />

        <div className='col-span-2'>
          <hr className='w-11/12 h-px mx-auto my-5 bg-gray-200 border-0 dark:bg-gray-700' />
          <span className='block mx-auto -mt-[1.9rem] mb-2 px-3 w-min whitespace-nowrap bg-white text-sm text-center text-slate-500'>
            初次發現狀況
          </span>
        </div>
      </div>

      <div className='flex items-center justify-center w-full gap-x-2 mt-2 text-sm'>
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
