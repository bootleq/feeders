"use client"

import * as R from 'ramda';
import { useCallback } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { viewCtrlAtom, toggleViewCtrlAtom, VIEW_CTRL_KEYS, tagsAtom, mergeTagsAtom, togglaAllTagsAtom } from './store';
import type { Tags } from './store';
import tlStyles from './timeline.module.scss';
import { getTagColor } from './colors';
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

function ViewCtrlPanel() {
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
    <div className='pb-3'>
      <div className='font-bold'>顯示控制</div>
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

        <div className="inline-flex items-center justify-start text-sm mt-1">
          全部
          <div className='inline-flex items-center gap-x-1 ml-2'>
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

function TagCtrlPanel() {
  const [tags, setTags] = useAtom(mergeTagsAtom);
  const toggleAllTags = useSetAtom(togglaAllTagsAtom);
  const onClick = (e: React.MouseEvent) => {
    const el = e.target as HTMLElement;
    const li = el.closest('li')
    if (li) {
      const { tag, visible } = li.dataset;
      setTags({ [tag || '']: visible === 'false' })
    }
  };
  const onToggleAll = (toggle: boolean) => () => toggleAllTags(toggle);

  return (
    <div className='py-3'>
      <div className='font-bold'>標籤篩選</div>
      <div className='flex flex-col items-start w-fit px-2 py-2 gap-y-2'>
        <ul className='text-xs flex items-center' onClick={onClick}>
          {Object.entries(tags).map(([tag, visible]) => {
            return (
              <li key={tag} data-tag={tag} data-visible={visible} className={`py-0.5 relative cursor-pointer ${!visible && tlStyles.strikethrough}`}>
                <div tabIndex={0} className={`${getTagColor(tag).join(' ')} rounded-full px-1 p-px mx-px border text-nowrap focus:ring ring-blue-300`}>
                  {tag || <span className='px-1'>無</span>}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="inline-flex items-center justify-start text-sm mt-1">
          全部
          <div className='inline-flex items-center gap-x-1 ml-2'>
            <button type='button' className='btn bg-slate-100 py-0 ring-1 hover:bg-white' onClick={onToggleAll(true)} aria-label='顯示'>
              <EyeIcon className='stroke-slate-700' height={20} />
            </button>
            <button type='button' className='btn bg-slate-100 py-0 ring-1 hover:bg-white' onClick={onToggleAll(false)} aria-label='隱藏'>
              <EyeSlashIcon className='stroke-slate-700' height={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SideControl({ tags }: {
  tags: Tags,
}) {
  useHydrateAtoms([
    [tagsAtom, tags],
  ]);

  return (
    <div className='p-2 pb-7 sm:pb-2 divide-y-4'>
      <ViewCtrlPanel />
      <TagCtrlPanel />
    </div>
  );
}
