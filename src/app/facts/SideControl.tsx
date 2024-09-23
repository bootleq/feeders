"use client"

import * as R from 'ramda';
import { z } from 'zod';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useHydrateAtoms, atomWithStorage } from 'jotai/utils';
import {
  viewCtrlAtom,
  toggleViewCtrlAtom,
  VIEW_CTRL_KEYS,
  columnsAtom,
  dateRangeAtom,
  dateRejectedCountAtom,
  tagsAtom,
  mergeTagsAtom,
  togglaAllTagsAtom,
  markPickingAtom,
  marksAtom,
  removeMarkAtom,
  peekingMarkAtom,
  timelineInterObserverAtom,
} from './store';
import type { Tags, FactMark, DateRange } from './store';
import tlStyles from './timeline.module.scss';
import { getTagColor } from './colors';
import { TextInput } from '@/components/form/Inputs';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';
import { AnimateOnce } from '@/components/AnimateOnce';
import { addAlertAtom } from '@/components/store';
import { EyeIcon } from '@heroicons/react/24/outline';
import { EyeSlashIcon } from '@heroicons/react/24/outline';
import { CursorArrowRippleIcon } from '@heroicons/react/24/solid';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const localMarksAtom = atomWithStorage<FactMark[]>('feeders.factMarks', []);

const MAX_COLUMNS = 4;

const dateSchema = z.string().date();

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
  const [columns, setColumns] = useAtom(columnsAtom);

  const onToggleAll = (toggle: boolean) => {
    if (toggle) {
      return () => setWholeViewCtrl(VIEW_CTRL_KEYS);
    } else {
      return () => setWholeViewCtrl([]);
    }
  };

  const onToggleColumn = (e: React.MouseEvent) => {
    const el = e.currentTarget as HTMLElement;
    const idx = parseInt(el.dataset.index || '', 10);
    if (idx > 0) {
      const newColumns = R.over(R.lensIndex(idx), R.not, columns);
      setColumns(newColumns);
    }
  };
  const onAddColumn = () => {
    if (columns.length <= MAX_COLUMNS) {
      setColumns(R.append(false, columns));
    }
  };
  const onRemoveColumn = () => {
    if (columns.length > 1) {
      setColumns(columns.slice(0, -1));
    }
  };

  const colFilledCls = 'bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,.2),rgba(0,0,0,.2)_2px,transparent_3px,transparent_6px)]';

  return (
    <div className='pb-3'>
      <div className='font-bold'>顯示控制</div>
      <div className='flex items-start flex-wrap justify-between'>
        <div className='flex flex-col items-start w-fit px-1 py-2 gap-y-2'>
          <ViewToggle section='desc' current={viewCtrl} setter={setViewCtrl}>
            <span className="px-2 ms-3 text-sm text-nowrap">內文</span>
          </ViewToggle>
          <ViewToggle section='summary' current={viewCtrl} setter={setViewCtrl}>
            <span className={`relative px-2 ms-3 text-sm text-nowrap ring-1`}>
              <div className={tlStyles['summary-mark']}></div>
              摘要
            </span>
          </ViewToggle>
          <ViewToggle section='origin' current={viewCtrl} setter={setViewCtrl}>
            <span className="px-2 ms-3 text-sm text-zinc-700 text-nowrap">出處</span>
          </ViewToggle>

          <div className="inline-flex items-center justify-start text-sm mt-1">
            <div className='text-nowrap'>
              全部
            </div>
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

        <div className='group flex-col items-center flex-grow w-fit px-2 py-1 gap-y-1 text-sm hidden md:flex'>
          <div className='text-slate-700 invisible group-hover:visible'>
            分欄
          </div>
          <div className='flex items-start gap-x-2'>
            {
              columns.map((col, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center h-14 ring ring-slate-400/50 hover:ring-slate-500 px-px ${idx > 0 ? 'cursor-pointer' : 'cursor-default'} ${col ? colFilledCls : ''}`}
                >
                  <div className='flex-grow content-center font-mono text-slate-300 group-hover:text-slate-700 group-hover:font-bold' data-index={idx} onClick={onToggleColumn}>
                    {idx + 1}
                  </div>
                </div>
              ))
            }
          </div>
          <div className='mt-1 font-mono font-bold invisible group-hover:visible sm:[@media(any-hover:none)]:visible'>
            {columns.length > 1 &&
              <button type='button' className='btn p-1 text-slate-600/50 hover:text-black hover:ring' onClick={onRemoveColumn} aria-label='減少分欄'> - </button>
            }
            { columns.length <= MAX_COLUMNS &&
              <button type='button' className='btn p-1 text-slate-600/50 hover:text-black hover:ring' onClick={onAddColumn} aria-label='增加分欄'> + </button>
            }
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

function DateCtrlPanel() {
  const [range, setRange] = useAtom(dateRangeAtom);
  const rejectedCount = useAtomValue(dateRejectedCountAtom);
  const inputCls = 'text-xs bg-slate-300/50 focus:bg-transparent';

  const onApply = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newRange = [formData.get('fromDate'), formData.get('toDate')];
    if (newRange.every(str => dateSchema.safeParse(str).success)) {
      setRange(newRange as DateRange);
    } else {
      console.error('日期不正確');
    }
  };

  const onReset = () => {
    setRange(['', '']);
  };

  return (
    <div className='py-3'>
      <div className='font-bold'>日期篩選</div>
      <form onSubmit={onApply} className={`flex flex-wrap items-center gap-x-1 my-1 text-sm ${tlStyles['ctrl-date-filter']}`}>
        <div className='whitespace-nowrap inline-flex items-center'>
          <TextInput label='從' name='fromDate' type='date' inputProps={{required: true, className: inputCls, defaultValue: '1900-01-01', 'aria-label': '從'}} />
        </div>
        <div className='whitespace-nowrap inline-flex items-center'>
          <TextInput label='到' name='toDate' type='date' inputProps={{required: true, className: inputCls}} />
        </div>

        <button className='btn ml-1 flex items-center hover:ring-1 hover:bg-white active:ring' aria-label='套用'>
          <CheckIcon className='stroke-current' height={20} />
        </button>

        <div className='flex items-center text-xs text-slate-600'>
          <div>
            已排除：<span className='text-sm font-mono'>{rejectedCount}</span>
          </div>
          <button type='reset' className='btn ml-2 hover:ring-1 hover:bg-white active:ring' onClick={onReset}>
            重設
          </button>
        </div>
      </form>
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

const validateLocalMark = ({ anchor, title }: FactMark) => {
  if (R.type(anchor) !== 'String' || R.type(title) !== 'String') {
    throw new Error(`異常的本機 mark 記錄，anchor: ${anchor}`);
  }
};

function MarkCtrlPanel() {
  const [localMarks, setLocalMarks] = useAtom(localMarksAtom);
  const [markPicking, setMarkPicking] = useAtom(markPickingAtom);
  const [marks, setMarks] = useAtom(marksAtom);
  const [savedHint, setSavedHint] = useState(false);
  const initialLoad = useRef(true);

  useEffect(() => {
    if (initialLoad) {
      localMarks.forEach(validateLocalMark);
      setMarks(localMarks);
      initialLoad.current = false;
    }
  }, [setMarks, localMarks]);

  const onTogglePicker = (e: React.MouseEvent) => {
    setMarkPicking(R.not);
  };

  const onSave = () => {
    setLocalMarks(marks);
    setSavedHint(true);
  };

  const onSavedHintFaded = () => {
    setSavedHint(false);
  }

  return (
    <div className='py-3'>
      <div className='font-bold'>記號</div>
      <div className='flex flex-col items-start w-full pl-1 py-2 gap-y-2 text-sm'>
        <div className='w-full flex items-center justify-end gap-x-1'>
          {savedHint &&
            <AnimateOnce onComplete={onSavedHintFaded} className='flex items-center w-fit mr-2 text-green-700'>
              <CheckCircleIcon className='stroke-current' height={20} />
              已儲存
            </AnimateOnce>
          }
          <Tooltip placement='bottom-end'>
            <TooltipTrigger className=''>
              <button type='button' className='btn bg-slate-100 text-slate-600 hover:text-black hover:ring-1 hover:bg-white' aria-label='儲存到瀏覽器空間' onClick={onSave}>
                <ArrowDownTrayIcon className='stroke-current' height={20} />
              </button>
            </TooltipTrigger>
            <TooltipContent className="p-1 text-xs rounded box-border w-max z-[1002] bg-slate-100 ring-1 text-balance">
              記住目前清單（儲存在瀏覽器本機空間）
            </TooltipContent>
          </Tooltip>

          <button type='button' className={`btn flex items-center py-0.5 text-slate-600 hover:text-black hover:ring-1 hover:bg-white ${markPicking ? 'bg-white' : 'bg-slate-100'}`} onClick={onTogglePicker}>
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
        </div>

        <ul className='divide-y-2 divide-slate-300 w-full'>
          {marks.length ?
            marks.map(({ anchor, title }, idx) => (
              <Mark key={anchor} index={idx} anchor={anchor} title={title} />
            ))
          :
            <li className='text-slate-600'>（空）</li>
          }
        </ul>

        <div className="inline-flex items-center justify-start text-sm mt-1 ml-auto">
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
    <div className='p-2 pb-7 sm:pb-2 divide-y-4 overflow-auto scrollbar-thin'>
      <ViewCtrlPanel />
      <TagCtrlPanel />
      <DateCtrlPanel />
      <MarkCtrlPanel />
    </div>
  );
}
