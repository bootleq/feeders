"use client"

import * as R from 'ramda';
import { z } from 'zod';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useDebouncedCallback } from 'use-debounce';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useHydrateAtoms, atomWithStorage } from 'jotai/utils';
import { format } from '@/lib/date-fp';
import {
  viewCtrlAtom,
  toggleViewCtrlAtom,
  VIEW_CTRL_KEYS,
  columnsAtom,
  textFilterAtom,
  textHighlightAtom,
  dateRangeAtom,
  filterRejectedCountAtom,
  factsAtom,
  tagsAtom,
  mergeTagsAtom,
  togglaAllTagsAtom,
  filterByMarksAtom,
  markPickingAtom,
  localMarksAtom,
  peekingMarkAtom,
  picksModeAtom,
  pickAtom,
} from './store';
import type { Tags, Fact, DateRange } from './store';
import type { AnyFunction } from '@/lib/utils';
import { tooltipClass, tooltipMenuCls } from '@/lib/utils';
import useClientOnly from '@/lib/useClientOnly';
import { findFactElement, clearMarkIndicators } from './utils';
import tlStyles from './timeline.module.scss';
import { getTagColor } from './colors';
import MarkList from './MarkList';
import { addAlertAtom } from '@/components/store';
import { TextInput } from '@/components/form/Inputs';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipContentMenu, menuHoverProps } from '@/components/Tooltip';
import { AnimateOnce } from '@/components/AnimateOnce';
import { EyeIcon } from '@heroicons/react/24/outline';
import { EyeSlashIcon } from '@heroicons/react/24/outline';
import { CursorArrowRippleIcon } from '@heroicons/react/24/solid';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/outline';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { GlobeAltIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import {
  ArrowLeftEndOnRectangleIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import UserPenIcon from '@/assets/user-pen.svg';
import HighlighterIcon from '@/assets/highlighter.svg';
import FunnelIcon from '@/assets/funnel.svg';
import FunnelXIcon from '@/assets/funnel-x.svg';

// NOTE: old storage key was 'feeders.factMarks.slot', breaking changed
const currentMarkSlotAtom = atomWithStorage('feeders.facts.marks.slot', 0);
const markSlotAtoms = R.range(0, 4).map(n => atomWithStorage<number[]>(`feeders.facts.marks.${n}`, []));

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
  const [detailsOpen, setDetailsOpen] = useState(false);

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
    setDetailsOpen(open);

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
            <Tooltip placement='right'>
              <TooltipTrigger className=''>
                <details className='text-amber-900'>
                  <summary className='cursor-pointer sm:opacity-40 group-hover:opacity-100' onClick={onToggleDetails}>
                    <div className='inline-flex items-center'>
                      <span className='sm:hidden group-hover:inline mr-1'>
                        細節元素
                      </span>
                      <span className='-translate-y-px'>
                        {detailsOpen ?
                          <EyeIcon className='stroke-current inline' height={15} /> :
                          <EyeSlashIcon className='stroke-current inline' height={15} />
                        }
                      </span>
                    </div>
                  </summary>
                </details>
              </TooltipTrigger>
              <TooltipContent className="p-1 text-xs rounded box-border w-max z-[1002] bg-slate-100 ring-1">
                一次開關內文中可展開／收合的區塊
              </TooltipContent>
            </Tooltip>
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

  const toggle = () => {
    setPanelOpen(R.not);
  };

  return (
    <div className='py-3'>
      <div className='font-bold cursor-pointer' onClick={toggle}>文字或日期篩選</div>
      <div className={`${panelOpen ? '' : 'hidden'}`}>
        <TextFilterCtrlPanel />
        <DateCtrlPanel />
      </div>
    </div>
  );
}

function FilterResultCount({ total }: { total: number }) {
  const [panelOpen, setPanelOpen] = useState(true);
  const rejectedCount = useAtomValue(filterRejectedCountAtom);
  const toggle = () => {
    setPanelOpen(R.not);
  };

  return (
    <div className={`${panelOpen ? 'py-2' : 'py-0 opacity-20 border-none'}`}>
      <div className='flex items-center gap-x-4 text-xs text-slate-600'>
        <div className='cursor-pointer' onClick={toggle}>
          顯示筆數 <span className='font-mono'>{total - rejectedCount}</span>
        </div>
        {
          rejectedCount > 0 &&
          <div className=''>
            已排除 <span className='font-mono text-red-700'>{rejectedCount}</span>
          </div>
        }
      </div>
    </div>
  );
}

function TextFilterCtrlPanel() {
  const [text, setText] = useAtom(textFilterAtom);
  const [textHighlight, setTextHighlight] = useAtom(textHighlightAtom);
  const formRef = useRef<HTMLFormElement>(null);

  const debouncedChanged = useDebouncedCallback((event: React.FormEvent) => {
    const el = event.target as HTMLInputElement;
    const v = el.value;
    if (v.length > 1) {
      setText(v);
    } else {
      setText('');
    }
  }, 360);

  const fakeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e && e.preventDefault();

    const form = formRef.current;
    if (!form) return;
    form.submit(); // dual submit to noop
  };

  const onReset = () => {
    setText('');
  };

  const onToggleHighlight = (e: React.MouseEvent) => {
    setTextHighlight(R.not);
  };

  const defaultText = text;

  return (
    <div className=''>
      <form ref={formRef} onChange={debouncedChanged} className={`flex flex-wrap items-center gap-x-1 my-1 text-sm`} target='noop-trap' onSubmit={fakeSubmit}>
        <div className='whitespace-nowrap inline-flex items-center'>
          <TextInput label='包含' name='targetText' inputProps={{className: 'text-sm opacity-60 focus:opacity-100 placeholder-slate-800/50', placeholder: '輸入至少 2 個字', defaultValue: defaultText}} />
        </div>
        <button type='reset' className='btn px-px hover:ring-1 hover:bg-white active:ring' onClick={onReset} aria-label='重設'>
          <XCircleIcon className='stroke-slate-600' height={20} />
        </button>
        <Tooltip>
          <TooltipTrigger className='mb-1 block truncate'>
            <button type='button' className={`btn px-px hover:ring-1 hover:bg-white active:ring ${textHighlight ? '' : 'opacity-40'}`} onClick={onToggleHighlight} aria-label='著色強調'>
              <HighlighterIcon className={`stroke-slate-600 ${textHighlight ? 'fill-pink-200/95' : ''}`} width={20} height={20} />
            </button>
          </TooltipTrigger>
          <TooltipContent className="p-1 text-xs rounded box-border w-max z-[1002] bg-slate-100 ring-1">
            關鍵字著色：{textHighlight ? '已開啟' : '已關閉'}
          </TooltipContent>
        </Tooltip>
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

const validateStorageMark = (item: any) => {
  if (R.type(item) !== 'Number') {
    throw new Error(`異常的本機 mark 記錄: ${JSON.stringify(item)}`);
  }
};

const createStorageAtom = (slot: number) => {
  return atom(
    get => get(markSlotAtoms[slot]),
    (get, set, update: number[]) => {
      set(markSlotAtoms[slot], update);
    }
  );
};

const pickForkHint = (pickId: number) => {
  const url = new URL(window.location.href);
  const link = `${url.origin}/facts/pick/${pickId}`;

  return [
    "（❗ 這篇原本是別人發布的內容，因「編輯」而複製過來，請尊重他人著作，不要直接發布。",
    `原文連結： ${link}`,
    "內容複製如下 🡻🡻）\r\n",
  ].join("\r\n")
};

function MarkCtrlPanel({ facts }: {
  facts: Fact[]
}) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [slot, setSlot] = useAtom(currentMarkSlotAtom);
  const [filtered, setFiltered] = useAtom(filterByMarksAtom);
  const [markPicking, setMarkPicking] = useAtom(markPickingAtom);
  const [localMarks, setLocalMarks] = useAtom(localMarksAtom);
  const [savedHint, setSavedHint] = useState(false);
  const slotAtom = useMemo(() => createStorageAtom(slot), [slot]);
  const [storageMarks, setStorageMarks] = useAtom(slotAtom);
  const [picksMode, setPicksMode] = useAtom(picksModeAtom);
  const [pick, setPick] = useAtom(pickAtom);
  const addAlert = useSetAtom(addAlertAtom);
  const { data: session, status } = useSession();

  const canEdit = status === 'authenticated' && session.user.state === 'active';
  const userId = session?.user.id;

  const toggle = () => {
    setPanelOpen(R.not);
  };

  useEffect(() => {
    storageMarks.forEach(validateStorageMark);
    setLocalMarks(storageMarks);
  }, [setLocalMarks, storageMarks]);

  useEffect(() => {
    // Quit /picks/ path started from server side
    if (!['index', 'item'].includes(picksMode)) {
      const path = window.location.pathname;
      if (path.startsWith('/facts/picks/')) {
        window.history.replaceState(window.history.state, '', '/facts/');
      }
    }
  }, [picksMode]);

  useEffect(() => {
    // Quit /picks/ path started from server side
    const path = window.location.pathname;
    if (pick && path.startsWith('/facts/picks/')) {
      if (!path.startsWith(`/facts/picks/${pick.id}/`)) {
        window.history.replaceState(window.history.state, '', '/facts/');
      }
    }
  }, [pick]);

  const isSlotDirty = useMemo(() => {
    if (pick) {
      return true;
    }
    if (localMarks.length !== storageMarks.length) {
      return true;
    }
    if (localMarks.length === 0) {
      return false;
    }
    return JSON.stringify(localMarks) !== JSON.stringify(storageMarks);
  }, [localMarks, storageMarks, pick]);

  const onTogglePicker = (e: React.MouseEvent) => {
    setMarkPicking(R.not);
  };

  const onSwitchSlot = (e: React.MouseEvent<HTMLElement>) => {
    if (localMarks.length > 0 && localMarks.length !== storageMarks.length) {
      addAlert('error', <>儲存槽 <var className='font-mono font-bold'>{slot + 1}</var> 的內容還未存檔，請先儲存，或清空</>);
    } else {
      const el = e.currentTarget as HTMLElement;
      const idx = parseInt(el.dataset.slot || '', 10);
      setSlot(idx);
    }
  };

  const onSave = () => {
    if (pick) {
      if (localMarks.length) {
        addAlert('error', <>儲存槽 <var className='font-mono font-bold'>{slot + 1}</var> 已經有內容，請先清空或換一個儲存槽</>);
      } else {
        setLocalMarks(pick.factIds);
        setStorageMarks(pick.factIds);
        setSavedHint(true);
      }
    } else {
      setStorageMarks(localMarks);
      setSavedHint(true);
    }
  };

  const onDownload = () => {
    const blob = new Blob([JSON.stringify(localMarks, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fact-marks-${slot}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const onToggleFilter = useCallback(() => {
    setFiltered(R.not);
  }, [setFiltered]);

  const onListPicks = useCallback(() => {
    setPicksMode('index');
  }, [setPicksMode]);

  const onListMyPicks = useCallback(() => {
    setPicksMode('my');
  }, [setPicksMode]);

  const onEditPick = useCallback(() => {
    if (!userId) {
      throw new Error('未登入');
    }

    if (pick) {
      if (!pick.userId || userId === pick.userId) {
        setPick(pick);
      } else {
        setPick({
          title: `（複製自${pick.userName}）${pick.title}`,
          desc: `${pickForkHint(pick.id)}\n${pick.desc}`,
          userId: userId,
          userName: '',
          factIds: pick.factIds,
          state: 'draft',
          id: 0,
          publishedAt: null,
          createdAt: null,
          changes: 0,
          changedAt: null,
        });
      }
      setPicksMode('edit');
      setFiltered(true);
      return;
    }

    if (localMarks.length) {
      const now = new Date();
      setPick({
        title: `未命名 ${format({}, 'yyyyMMdd HH:mm', now)}`,
        desc:  '',
        factIds: localMarks,
        state: 'draft',
        id: 0,
        userId: '',
        userName: '',
        publishedAt: null,
        createdAt: null,
        changes: 0,
        changedAt: null,
      });
      setPicksMode('edit');
      setFiltered(true);
    } else {
      addAlert('error', <>請先建立至少一個記號，按「選取<CursorArrowRippleIcon className='stroke-slate-700 stroke-0 ml-1' height={20} />」開始</>);
    }
  }, [localMarks, pick, userId, setPick, setPicksMode, setFiltered, addAlert]);

  const onSavedHintFaded = () => {
    setSavedHint(false);
  };

  return (
    <div className='py-3 flex-grow flex flex-col'>
      <div className='font-bold cursor-pointer flex items-center'>
        <div className='flex-grow' onClick={toggle}>
          記號
        </div>
        <div className='ml-auto flex items-center'>
          <Tooltip placement='top-start'>
            <TooltipTrigger className=''>
              <button type='button' className='btn text-slate-600 px-1 py-px translate-x-1 hover:text-black hover:ring-1 hover:bg-white disabled:opacity-30' aria-label='儲存到瀏覽器空間' onClick={onToggleFilter}
              >
                {filtered ? <FunnelIcon className='' height={20} /> : <FunnelXIcon className='opacity-55' height={20} />
                }
              </button>
            </TooltipTrigger>
            <TooltipContent className="p-1 text-sm rounded box-border w-max z-[1002] bg-slate-100 ring-1 text-balance shadow-lg">
              篩選：只顯示對應<strong>記號</strong>的項目（{ filtered ? '已開啟' : '已關閉' }）
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className={`flex flex-col flex-grow items-start w-full pl-1 py-2 gap-y-2 text-sm ${panelOpen ? '' : 'hidden'}`}>
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

            <Tooltip placement='top-start'>
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

            <Tooltip placement='top-start' hoverProps={menuHoverProps} role='menu'>
              <TooltipTrigger className=''>
                <button type='button' className={`btn hover:text-black hover:ring-1 ${pick ? 'bg-rose-100 text-slate-800 ring-1' : 'text-slate-600 bg-slate-100'} hover:bg-white`} aria-label='閱讀選集'>
                  <GlobeAltIcon height={20} />
                </button>
              </TooltipTrigger>
              <TooltipContentMenu className={tooltipClass('text-sm drop-shadow-md')}>
                <div className={tooltipMenuCls()}>
                  <Tooltip placement='right' offset={6} hoverProps={menuHoverProps}>
                    <TooltipTrigger className='p-2 w-full cursor-pointer flex items-center gap-1 rounded hover:bg-amber-200' onClick={onListPicks}>
                      <BookOpenIcon className='stroke-current' height={20} />
                      閱讀公開選集
                    </TooltipTrigger>
                    <TooltipContent className='p-1 text-xs rounded box-border w-max z-[1002] bg-slate-100 ring-1 text-balance shadow-lg'>
                      顯示由使用者分享的選集
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip placement='right' offset={6} hoverProps={menuHoverProps}>
                    <TooltipTrigger
                      className={`p-2 w-full ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-45'} flex items-center gap-1 rounded hover:bg-amber-200`}
                      {...(canEdit ? {onClick: onListMyPicks} : {})}
                    >
                      <UserPenIcon className='stroke-current' height={20} />
                      我的選集
                    </TooltipTrigger>
                    <TooltipContent className='p-1 text-xs rounded box-border w-max z-[1002] bg-slate-100 ring-1 text-balance shadow-lg'>
                      { canEdit ? '查看我編寫的選集，包括草稿' : '登入後才可以使用' }
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip placement='right' offset={6} hoverProps={menuHoverProps}>
                    <TooltipTrigger
                      className={`p-2 w-full ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-45'} flex items-center gap-1 rounded hover:bg-amber-200`}
                      {...(canEdit ? {onClick: onEditPick} : {})}
                    >
                      <ArrowUpTrayIcon className='stroke-current' height={20} />
                      編輯與上傳
                    </TooltipTrigger>
                    <TooltipContent className='p-1 text-xs rounded box-border w-max z-[1002] bg-slate-100 ring-1 text-balance shadow-lg'>
                      { canEdit ? '編寫題目與說明，上傳分享目前清單' : '登入後才可以使用' }
                    </TooltipContent>
                  </Tooltip>

                </div>
              </TooltipContentMenu>
            </Tooltip>

            <Tooltip placement='top-start'>
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

        <MarkList facts={facts} />

        <div className="inline-flex items-center justify-start text-sm mt-1 ml-auto">
        </div>
      </div>
    </div>
  );
}

export default function SideControl({ tags, facts: initialFacts }: {
  tags: Tags,
  facts: Fact[],
}) {
  useHydrateAtoms([
    [factsAtom, initialFacts],
    [tagsAtom, tags],
  ]);
  const facts = useAtomValue(factsAtom);

  return (
    <div className='p-2 pb-7 sm:pb-2 divide-y-4 overflow-auto scrollbar-thin flex flex-col flex-grow' data-nosnippet>
      <ViewCtrlPanel />
      <TagCtrlPanel />
      <FiltersCtrl />
      <FilterResultCount total={facts.length} />
      <MarkCtrlPanel facts={facts} />
      <iframe name='noop-trap' className='hidden' />
    </div>
  );
}
