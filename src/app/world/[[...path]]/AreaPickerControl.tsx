"use client"

import * as R from 'ramda';
import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';
import { useState } from 'react';
import type { LatLngBounds } from '@/lib/schema';
import { userAtom, mapAtom, areaPickerAtom, } from '@/app/world/[[...path]]/store';
import { saveUserArea } from '@/app/world/[[...path]]/save-user-area';
import { addAlertAtom } from '@/components/store';
import { CheckIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';

export const AREA_PICKER_MIN_ZOOM = 14;

const setUserAreaAtom = atom(
  null,
  (get, set, update: {areaId: number, bounds: LatLngBounds}) => {
    set(userAtom, (v) => v ? R.mergeLeft(update)(v) : v)
  }
);

export default function AreaPickerControl(params: any) {
  const map = useAtomValue(mapAtom);
  const [picker, setPicker] = useAtom(areaPickerAtom);
  const setUserArea = useSetAtom(setUserAreaAtom);
  const [sending, setSending] = useState(false);
  const addAlert = useSetAtom(addAlertAtom);

  if (!map) {
    return null;
  }

  const onSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const bbox = map.getBounds().toBBoxString();
    const formData = new FormData();
    formData.append('id', picker?.id ? String(picker.id) : '');
    formData.append('bbox', bbox);

    setSending(true);
    const res = await saveUserArea(formData);

    if (res.errors) {
      const errorNode = <>{res.msg}</>;
      addAlert('error', errorNode);
    } else {
      setPicker(null);
      if (res.item) {
        setUserArea({ areaId: res.item.id, bounds: res.item.bounds });
      }
    }
    setSending(false);
  };

  const canSave = !sending && map.getZoom() >= AREA_PICKER_MIN_ZOOM;

  return (
    <div className='flex items-center gap-x-2'>
      <button onClick={onSubmit} className='btn bg-slate-100 ring-1 flex items-center hover:bg-white' disabled={!canSave}>
        <CheckIcon className='stroke-green-700' height={20} />
        {sending ? '處理中……' : '儲存'}
      </button>
      <button className='btn bg-slate-100 ring-1 flex items-center hover:bg-white' onClick={() => setPicker(null)}>
        <XMarkIcon className='stroke-red-700' height={20} />
        取消
      </button>
    </div>
  );
}
