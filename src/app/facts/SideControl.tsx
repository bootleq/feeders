"use client"

import * as R from 'ramda';
import { useCallback } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { viewCtrlAtom, toggleViewCtrlAtom, VIEW_CTRL_KEYS } from './store';
import tlStyles from './timeline.module.scss';
import { EyeIcon } from '@heroicons/react/24/outline';
import { EyeSlashIcon } from '@heroicons/react/24/outline';

function ViewToggle({ section, current, setter, children }: {
  section: string,
  current: string[],
  setter: (update: string) => void,
  children?: React.ReactNode
}) {
  const checked = R.includes(section, current);
  const onChange = useCallback(() => setter(section), [section, setter]);

  return (
    <label className="inline-flex items-center cursor-pointer">
      <input type='checkbox' className='sr-only peer' checked={checked} onChange={onChange} />
      <div className="relative w-[2.35rem] h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
      {children}
      {checked ?
        <EyeIcon className='stroke-slate-700 ml-2' height={20} /> :
        <EyeSlashIcon className='stroke-slate-700 ml-2' height={20} />
      }
    </label>
  );
}

export default function SideControl() {
  const setWholeViewCtrl = useSetAtom(viewCtrlAtom);
  const [viewCtrl, setViewCtrl] = useAtom(toggleViewCtrlAtom);
  const onToggleAll = (toggle: boolean) => {
    if (toggle) {
      return () => setWholeViewCtrl(VIEW_CTRL_KEYS);
    } else {
      return () => setWholeViewCtrl([]);
    }
  };

  return (
    <div className='p-2 pb-7 sm:pb-2'>
      <div className='bold'>
        顯示控制
      </div>

      <div className='flex flex-col items-start w-fit px-2 py-2 gap-y-2'>
        <ViewToggle section='desc' current={viewCtrl} setter={setViewCtrl}>
          <span className="px-2 ms-3 text-sm">內文</span>
        </ViewToggle>
        <ViewToggle section='summary' current={viewCtrl} setter={setViewCtrl}>
          <span className={`relative px-2 ms-3 text-sm ring-1`}>
            <div className={tlStyles['summary-mark']}></div>
            摘要
          </span>
        </ViewToggle>
        <ViewToggle section='origin' current={viewCtrl} setter={setViewCtrl}>
          <span className="px-2 ms-3 text-sm text-zinc-700">出處</span>
        </ViewToggle>

        <div className="inline-flex items-center justify-start text-sm">
          全部
          <div className='inline-flex items-center gap-x-1 ml-1'>
            <button type='button' className='btn bg-slate-100 py-0 ring-1 hover:bg-white' onClick={onToggleAll(true)} disabled={viewCtrl.length === VIEW_CTRL_KEYS.length} aria-label='顯示'>
              <EyeIcon className='stroke-slate-700' height={20} />
            </button>
            <button type='button' className='btn bg-slate-100 py-0 ring-1 hover:bg-white' onClick={onToggleAll(false)} disabled={viewCtrl.length === 0} aria-label='隱藏'>
              <EyeSlashIcon className='stroke-slate-700' height={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
