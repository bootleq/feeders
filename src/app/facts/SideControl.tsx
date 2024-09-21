"use client"

import * as R from 'ramda';
import { useCallback } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import {
  viewCtrlAtom,
  toggleViewCtrlAtom,
  VIEW_CTRL_KEYS,
  tagsAtom,
  mergeTagsAtom,
  togglaAllTagsAtom,
  markPickingAtom,
  marksAtom,
  removeMarkAtom,
  peekingMarkAtom,
  timelineInterObserverAtom,
} from './store';
import type { Tags, FactMark } from './store';
import tlStyles from './timeline.module.scss';
import { getTagColor } from './colors';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';
import { addAlertAtom } from '@/components/store';
import { EyeIcon } from '@heroicons/react/24/outline';
import { EyeSlashIcon } from '@heroicons/react/24/outline';
import { CursorArrowRippleIcon } from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/24/outline';

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
      <div className='flex flex-col items-start w-fit px-1 py-2 gap-y-2'>
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
      <div className='flex flex-col items-start w-fit px-1 py-2 gap-y-2'>
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

const markDateCls = [
  'font-mono text-sm whitespace-nowrap ml-px mr-1 px-1 rounded-md ring-1 cursor-pointer',
  'text-red-950 bg-gradient-to-br from-amber-200 to-amber-200/80',
  'hover:ring hover:text-black',
].join(' ');

const findFact = (anchor?: string) => {
  if (!anchor) return;
  const timeline = document.querySelector('[data-role="timeline"]');
  const target = timeline?.querySelector(`[data-role='fact'][data-anchor='${anchor}']`);
  return target;
};

function Mark({ anchor, title, index }:
  FactMark & { index: number }
) {
  const addAlert = useSetAtom(addAlertAtom);
  const removeMark = useSetAtom(removeMarkAtom);
  const interObserver = useAtomValue(timelineInterObserverAtom);

  const onJump = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget;
    const { anchor } = el.dataset;
    const target = findFact(anchor);
    if (!target) {
      addAlert('error', <>無法跳到選定日期（可能已被隱藏）</>);
      e.preventDefault();
      return;
    }

    target.classList.remove(tlStyles['animate-flash']);
    window.setTimeout(() =>
      target.classList.add(tlStyles['animate-flash'])
    );

    const tl = target.closest('[data-role="timeline"]') as HTMLElement;
    if (tl) {
      delete tl.dataset.markOffscreen;
    }
  }, [addAlert]);

  const onRemove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    const li = el.closest('li');
    if (li) {
      const { anchor } = li.dataset;
      if (anchor) removeMark(anchor);
      const tl = document.querySelector('[data-role="timeline"]') as HTMLElement;
      if (tl) { delete tl.dataset.markOffscreen; }
    }
  }, [removeMark]);

  const onMouseEnter = useCallback((e: React.MouseEvent<HTMLLIElement>) => {
    const el = e.currentTarget;
    const { anchor } = el.dataset;
    const fact = findFact(anchor);
    const target = fact?.querySelector('[data-role="fact-date"]');
    if (target) {
      target.classList.add(tlStyles['peeking-target']);
      interObserver?.observe(target);
    }
  }, [interObserver]);

  const onMouseLeave = useCallback((e: React.MouseEvent<HTMLLIElement>) => {
    const cls = tlStyles['peeking-target'];
    const tl = document.querySelector('[data-role="timeline"]') as HTMLElement;
    document.querySelectorAll(`[data-role="fact-date"].${cls}`).forEach(el => el.classList.remove(cls));
    delete tl.dataset.markOffscreen;
  }, []);

  const date = R.match(/fact-(.+)_\d+/, anchor)[1];
  const datePadEnd = date.length < 10 ? <span className=''>{'\u00A0'.repeat(10 - date.length)}</span> : '';

  return (
    <li className='flex items-center py-1' data-anchor={anchor} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <a className={markDateCls} data-anchor={anchor} href={`#${anchor}`} onClick={onJump}>
        {date}{datePadEnd}
      </a>
      <Tooltip placement='right'>
        <TooltipTrigger className='mb-1 block truncate'>
          <div className='text-xs truncate'>
            {title}
          </div>
        </TooltipTrigger>
        <TooltipContent className="p-1 text-xs rounded box-border w-max z-[1002] bg-slate-100 ring-1">
          {title}
        </TooltipContent>
      </Tooltip>
      <button className='btn p-px ml-auto hover:bg-white rounded-full hover:scale-125 hover:drop-shadow' aria-label='刪除' onClick={onRemove}>
        <XMarkIcon className='stroke-slate-700 stroke-2' height={16} />
      </button>
    </li>
  );
}

function MarkCtrlPanel() {
  const [markPicking, setMarkPicking] = useAtom(markPickingAtom);
  const [marks, setMarks] = useAtom(marksAtom);

  const onTogglePicker = (e: React.MouseEvent) => {
    setMarkPicking(R.not);
  };

  return (
    <div className='py-3'>
      <div className='font-bold'>記號</div>
      <div className='flex flex-col items-start w-full pl-1 py-2 gap-y-2 text-sm'>
        <button type='button' className={`btn flex items-center py-0.5 ring-1 ml-auto hover:bg-white ${markPicking ? 'bg-white' : 'bg-slate-100'}`} onClick={onTogglePicker}>
          {markPicking ?
            <span className='text-black animate-pulse flex items-center'>
              選取項目
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className='ml-1' src='/assets/hand-pointer.svg' alt='右側' width={18} height={18} />
            </span>
            :
            <>
              增加
              <CursorArrowRippleIcon className='stroke-slate-700 stroke-0 ml-1' height={20} />
            </>
          }
        </button>

        <ul className='divide-y-2 divide-slate-300 w-full'>
          {marks.length ?
            marks.map(({ anchor, title }, idx) => (
              <Mark key={anchor} index={idx} anchor={anchor} title={title} />
            ))
          :
            <li className='text-slate-600'>（空）</li>
          }
        </ul>
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
    <div className='p-2 pb-7 sm:pb-2 divide-y-4 overflow-auto scrollbar-thin'>
      <ViewCtrlPanel />
      <TagCtrlPanel />
      <MarkCtrlPanel />
    </div>
  );
}
