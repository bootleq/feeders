"use client"

import * as R from 'ramda';
import { z } from 'zod';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useHydrateAtoms, atomWithStorage } from 'jotai/utils';
import {
  viewCtrlAtom,
  toggleViewCtrlAtom,
  VIEW_CTRL_KEYS,
  columnsAtom,
  textFilterAtom,
  dateRangeAtom,
  filterRejectedCountAtom,
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
import type { AnyFunction } from '@/lib/utils';
import useClientOnly from '@/lib/useClientOnly';
import { findFactElement, clearMarkIndicators } from './utils';
import tlStyles from './timeline.module.scss';
import { getTagColor } from './colors';
import { TextInput } from '@/components/form/Inputs';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';
import { AnimateOnce } from '@/components/AnimateOnce';
import { EyeIcon } from '@heroicons/react/24/outline';
import { EyeSlashIcon } from '@heroicons/react/24/outline';
import { CursorArrowRippleIcon } from '@heroicons/react/24/solid';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/outline';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/outline';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const currentMarkSlotAtom = atomWithStorage('feeders.factMarks.slot', 0);
const markSlotAtoms = R.range(0, 4).map(n => atomWithStorage<FactMark[]>(`feeders.factMarks.${n}`, []));

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
  const [panelOpen, setPanelOpen] = useState(true);
  const setWholeViewCtrl = useSetAtom(viewCtrlAtom);
  const [viewCtrl, setViewCtrl] = useAtom(toggleViewCtrlAtom);
  const [columns, setColumns] = useAtom(columnsAtom);

  const toggle = () => {
    setPanelOpen(R.not);
  };

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

  const onToggleDetails = useCallback((e: React.MouseEvent) => {
    const details = e.currentTarget.parentElement as HTMLDetailsElement;
    const open = R.not(details.open);

    document.querySelectorAll('[data-role="desc"] details').forEach(el => {
      (el as HTMLDetailsElement).open = open;
    });
  }, []);

  const colFilledCls = 'bg-[repeating-linear-gradient(-45deg,rgba(0,0,0,.2),rgba(0,0,0,.2)_2px,transparent_3px,transparent_6px)]';

  return (
    <div className='pb-3'>
      <div className='font-bold cursor-pointer' onClick={toggle}>顯示控制</div>
      <div className={`flex items-start flex-wrap justify-between ${panelOpen ? '' : 'hidden'}`}>
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
          <ViewToggle section='tags' current={viewCtrl} setter={setViewCtrl}>
            <span className="px-2 ms-3 text-xs rounded-full border">標籤</span>
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

        <div className='flex-col items-center flex-grow w-fit px-2 text-sm flex'>
          <div className='flex w-full'>
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

          <div className='group flex items-center justify-center w-full'>
            <details className='text-amber-900'>
              <summary className='cursor-pointer sm:opacity-40 group-hover:opacity-100' onClick={onToggleDetails}>
                <span className='sm:hidden group-hover:inline'>細節元素</span>
              </summary>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}

function TagCtrlPanel() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [tags, setTags] = useAtom(mergeTagsAtom);

  const toggle = () => {
    setPanelOpen(R.not);
  };

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
      <div className='font-bold cursor-pointer' onClick={toggle}>標籤篩選</div>
      <div className={`flex flex-col items-start w-fit px-1 py-2 gap-y-2 ${panelOpen ? '' : 'hidden'}`}>
        <ul className='text-xs flex flex-wrap items-center' onClick={onClick}>
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

function FiltersCtrl() {
  const [panelOpen, setPanelOpen] = useState(true);
  const rejectedCount = useAtomValue(filterRejectedCountAtom);

  const toggle = () => {
    setPanelOpen(R.not);
  };

  return (
    <div className='py-3'>
      <div className='font-bold cursor-pointer' onClick={toggle}>文字或日期篩選</div>
      <div className={`${panelOpen ? '' : 'hidden'}`}>
        <TextFilterCtrlPanel />
        <DateCtrlPanel />
        <div className='flex items-center text-xs text-slate-600'>
          已排除：<span className='text-sm font-mono'>{rejectedCount}</span>
        </div>
      </div>
    </div>
  );
}

function TextFilterCtrlPanel() {
  const [text, setText] = useAtom(textFilterAtom);
  const formRef = useRef<HTMLFormElement>(null);

  const debouncedChanged = useDebouncedCallback((event: React.FormEvent) => {
    const el = event.target as HTMLInputElement;
    const v = el.value;
    if (v.length > 2) {
      setText(v);
    } else {
      setText('');
    }
  }, 360);

  const defaultText = text;

  return (
    <div className=''>
      <form ref={formRef} onChange={debouncedChanged} className={`flex flex-wrap items-center gap-x-1 my-1 text-sm`}>
        <div className='whitespace-nowrap inline-flex items-center'>
          <TextInput label='包含' name='targetText' inputProps={{className: 'text-sm opacity-60 focus:opacity-100 placeholder-slate-800/50', placeholder: '輸入至少 3 個字', defaultValue: defaultText}} />
        </div>
      </form>
    </div>
  );
}

const checkDateRageInput = (form: HTMLFormElement) => {
  const formData = new FormData(form);
  const newRange = [
    formData.get('fromDate')?.toString() || '',
    formData.get('toDate')?.toString() || ''
  ];
  const valid = newRange.every(str => dateSchema.safeParse(str).success);
  return [newRange, valid] as [[string, string], boolean];
};

function DateCtrlPanel() {
  const [range, setRange] = useAtom(dateRangeAtom);
  const [inputValid, setInputValid] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const inClient = useClientOnly();

  const inputCls = 'text-xs bg-slate-300/50 focus:bg-transparent';

  useEffect(() => {
    if (formRef.current) {
      const [, valid] = checkDateRageInput(formRef.current);
      setInputValid(valid);
    }
  }, []);

  const onChange = (e: React.FormEvent<HTMLFormElement>) => {
    const [, valid] = checkDateRageInput(e.currentTarget);
    setInputValid(valid);
  };

  const onApply = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const [newRange,] = checkDateRageInput(e.currentTarget);
    if (newRange.every(str => dateSchema.safeParse(str).success)) {
      setRange(newRange as DateRange);
    } else {
      console.error('日期不正確');
    }
  };

  const onReset = () => {
    setRange(['', '']);
    setInputValid(false);
  };

  const defaultFromDate = range[0] || '2016-05-05';
  const defaultToDate = range[1];

  return (
    <div className='pb-px'>
      <form ref={formRef} onSubmit={onApply} onChange={onChange} className={`flex flex-wrap items-center gap-x-1 my-1 text-sm ${tlStyles['ctrl-date-filter']}`}>
        <div className='whitespace-nowrap inline-flex items-center'>
          <TextInput label='從' name='fromDate' type='date' inputProps={{required: true, className: inputCls, defaultValue: defaultFromDate, 'aria-label': '日期從'}} />
        </div>
        <div className='whitespace-nowrap inline-flex items-center'>
          <TextInput label='到' name='toDate' type='date' inputProps={{required: true, className: `${inputCls} min-w-16`, defaultValue: defaultToDate, 'aria-label': '日期到'}} />
        </div>

        {inClient &&
          <button className='btn ml-1 px-px flex items-center hover:ring-1 hover:bg-white active:ring' disabled={!inputValid} aria-label='套用'>
            <CheckIcon className={`stroke-current ${inputValid ? '' : 'opacity-30'}`} height={20} />
          </button>
        }

        <button type='reset' className='btn px-px hover:ring-1 hover:bg-white active:ring' onClick={onReset} aria-label='重設'>
          <XCircleIcon className='stroke-slate-600' height={20} />
        </button>
      </form>
    </div>
  );
}

const markDateCls = [
  'font-mono text-sm whitespace-nowrap ml-px mr-1 px-1 rounded-md ring-1 cursor-pointer',
  'text-red-950 bg-gradient-to-br from-amber-200 to-amber-200/80',
  'hover:ring hover:text-black',
].join(' ');

function Mark({ anchor, title, index }:
  FactMark & { index: number }
) {
  const removeMark = useSetAtom(removeMarkAtom);
  const interObserver = useAtomValue(timelineInterObserverAtom);

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
    const fact = findFactElement(anchor);
    const target = fact?.querySelector('[data-role="fact-date"]');
    if (target) {
      target.classList.add(tlStyles['peeking-target']);
      interObserver?.observe(target);
    }
  }, [interObserver]);

  const date = R.match(/fact-(.+)_\d+/, anchor)[1];
  const datePadEnd = date.length < 10 ? <span className=''>{'\u00A0'.repeat(10 - date.length)}</span> : '';

  return (
    <li className='flex items-center py-1' data-anchor={anchor} onMouseEnter={onMouseEnter} onMouseLeave={clearMarkIndicators}>
      <a className={markDateCls} data-anchor={anchor} href={`#${anchor}`}>
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

const createStorageAtom = (slot: number) => {
  return atom(
    get => get(markSlotAtoms[slot]),
    (get, set, update: FactMark[]) => {
      set(markSlotAtoms[slot], update);
    }
  );
};

function MarkCtrlPanel() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [slot, setSlot] = useAtom(currentMarkSlotAtom);
  const [markPicking, setMarkPicking] = useAtom(markPickingAtom);
  const [marks, setMarks] = useAtom(marksAtom);
  const [savedHint, setSavedHint] = useState(false);
  const initialLoad = useRef(true);
  const slotAtom = useMemo(() => createStorageAtom(slot), [slot]);
  const [localMarks, setLocalMarks] = useAtom(slotAtom);

  const toggle = () => {
    setPanelOpen(R.not);
  };

  useEffect(() => {
    if (initialLoad) {
      localMarks.forEach(validateLocalMark);
      setMarks(localMarks);
      initialLoad.current = false;
    }
  }, [setMarks, localMarks]);

  const isSlotDirty = useMemo(() => {
    if (marks.length !== localMarks.length) {
      return true;
    }
    if (marks.length === 0) {
      return false;
    }
    const makeKey = (items: FactMark[]) => items.map(R.prop('anchor')).join();
    return makeKey(marks) !== makeKey(localMarks);
  }, [marks, localMarks]);

  const onTogglePicker = (e: React.MouseEvent) => {
    setMarkPicking(R.not);
  };

  const onSwitchSlot = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget as HTMLElement;
    const idx = parseInt(el.dataset.slot || '', 10);
    setSlot(idx);
  };

  const onSave = () => {
    setLocalMarks(marks);
    setSavedHint(true);
  };

  const onDownload = () => {
    const blob = new Blob([JSON.stringify(marks, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fact-marks-${slot}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const onSavedHintFaded = () => {
    setSavedHint(false);
  };

  return (
    <div className='py-3'>
      <div className='font-bold cursor-pointer' onClick={toggle}>記號</div>
      <div className={`flex flex-col items-start w-full pl-1 py-2 gap-y-2 text-sm ${panelOpen ? '' : 'hidden'}`}>
        <div className='w-full flex items-center'>
          <ul className='flex items-center font-mono text-xs gap-x-1'>
            {markSlotAtoms.map((a, idx) => {
              const cls = 'rounded-full text-slate-600 text-opacity-0 ring-1 ring-slate-400';
              const current = idx === slot;
              return (
                <li key={idx} className=''>
                  <button type='button' data-slot={idx} className={`${cls} ${current ? 'bg-slate-500' : 'bg-white'}`} aria-label='切換 slot' onClick={onSwitchSlot}>
                    {idx}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className='flex items-center justify-end ml-auto gap-x-1'>
            {savedHint &&
              <AnimateOnce onComplete={onSavedHintFaded} className='flex items-center w-fit mr-2 text-green-700'>
                <CheckCircleIcon className='stroke-current' height={20} />
                已儲存
              </AnimateOnce>
            }

            <Tooltip placement='bottom-end'>
              <TooltipTrigger className=''>
                <button
                  type='button' className='btn bg-slate-100 text-slate-600 hover:text-black hover:ring-1 hover:bg-white disabled:opacity-30'
                  disabled={!isSlotDirty} aria-label='儲存到瀏覽器空間' onClick={onSave}
                >
                  <ArrowLeftEndOnRectangleIcon className='stroke-current' height={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="p-1 text-xs rounded box-border w-max z-[1002] bg-slate-100 ring-1 text-balance">
                記住目前清單（儲存在瀏覽器本機空間）
              </TooltipContent>
            </Tooltip>

            <Tooltip placement='bottom-end'>
              <TooltipTrigger className=''>
                <button type='button' className='btn bg-slate-100 text-slate-600 hover:text-black hover:ring-1 hover:bg-white' aria-label='儲存目前清單到本機' onClick={onDownload}>
                  <ArrowDownTrayIcon className='stroke-current' height={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="p-1 text-xs rounded box-border w-max z-[1002] bg-slate-100 ring-1 text-balance">
                下載目前清單
              </TooltipContent>
            </Tooltip>

            <button type='button' className={`btn flex items-center py-0.5 text-slate-600 hover:text-black hover:ring-1 hover:bg-white ${markPicking ? 'bg-white' : 'bg-slate-100'}`} onClick={onTogglePicker}>
              {markPicking ?
                <span className='text-black animate-pulse flex items-center'>
                  選取項目
                  <img className='ml-1' src='/assets/hand-pointer.svg' alt='右側' width={18} height={18} />
                </span>
                :
                <>
                  選取
                  <CursorArrowRippleIcon className='stroke-slate-700 stroke-0 ml-1' height={20} />
                </>
              }
            </button>
          </div>
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
      <FiltersCtrl />
      <MarkCtrlPanel />
    </div>
  );
}
