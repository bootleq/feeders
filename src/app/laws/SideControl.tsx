"use client"

import * as R from 'ramda';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useHydrateAtoms, atomWithStorage } from 'jotai/utils';
import Link from 'next/link';
import {
  ACT_ABBRS,
  toggleViewCtrlAtom,
  tagsAtom,
  mergeTagsAtom,
  togglaAllTagsAtom,
  markPickingAtom,
  marksAtom,
  removeMarkAtom,
  interObserverAtom,
} from './store';
import type { Tags, Mark } from './store';
import styles from './laws.module.scss';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';
import { AnimateOnce } from '@/components/AnimateOnce';
import { addAlertAtom } from '@/components/store';
import { EyeIcon } from '@heroicons/react/24/outline';
import { EyeSlashIcon } from '@heroicons/react/24/outline';
import { CursorArrowRippleIcon } from '@heroicons/react/24/solid';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/outline';

const localMarksAtom = atomWithStorage<Mark[]>('feeders.lawMarks', []);

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
  const [viewCtrl, setViewCtrl] = useAtom(toggleViewCtrlAtom);

  return (
    <div className='pb-3'>
      <div className='font-bold'>顯示控制</div>
      <div className='flex items-start flex-wrap justify-between'>
        <div className='flex flex-col items-start w-fit px-1 py-2 gap-y-2'>
          <ViewToggle section='body' current={viewCtrl} setter={setViewCtrl}>
            <span className="px-2 ms-3 text-sm text-zinc-700 text-nowrap">詳細</span>
          </ViewToggle>
          <ViewToggle section='penalty' current={viewCtrl} setter={setViewCtrl}>
            <span className="px-2 ms-3 text-sm text-zinc-700 text-nowrap">罰則</span>
          </ViewToggle>
        </div>
      </div>
    </div>
  );
}

function ActCtrlPanel() {
  return (
    <div className='py-3'>
      <div className='font-bold'>法規</div>
      <div className='flex flex-col items-start w-fit px-1 py-2'>
        <ul className='text-sm flex flex-wrap items-center gap-y-1'>
          {Object.entries(ACT_ABBRS).map(([act, abbr]) => {
            return (
              <li key={abbr} className='mx-1'>
                <Link href={`#act-${act}`} className='p-1 hover:bg-amber-300/50 hover:scale-125'>
                  {abbr}
                </Link>
              </li>
            );
          })}
        </ul>
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
        <ul className='text-xs flex flex-wrap items-center' onClick={onClick}>
          {Object.entries(tags).map(([tag, visible]) => {
            return (
              <li key={tag} data-tag={tag} data-visible={visible} className={`py-0.5 relative cursor-pointer ${!visible && styles.strikethrough}`}>
                <div tabIndex={0} className={`rounded-full px-1 p-px mx-px border text-nowrap focus:ring ring-blue-300`}>
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

const MarkArticleCls = [
  'font-mono text-sm whitespace-nowrap ml-px mr-1 px-1 rounded-md ring-1 cursor-pointer',
  'text-red-950 bg-gradient-to-br from-amber-200 to-amber-200/80',
  'hover:ring hover:text-black',
].join(' ');

const findItem = (anchor?: string) => {
  if (!anchor) return;
  const acts = document.querySelector('[data-role="acts"]');
  const target = acts?.querySelector(`[data-role='law'][data-anchor='${anchor}']`);
  return target;
};

function Mark({ anchor, title, index }:
  Mark & { index: number }
) {
  const addAlert = useSetAtom(addAlertAtom);
  const removeMark = useSetAtom(removeMarkAtom);
  const interObserver = useAtomValue(interObserverAtom);

  const onJump = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget;
    const { anchor } = el.dataset;
    const target = findItem(anchor);
    if (!target) {
      addAlert('error', <>無法跳到選定法條（可能已被隱藏）</>);
      e.preventDefault();
      return;
    }

    target.classList.remove(styles['animate-flash']);
    window.setTimeout(() =>
      target.classList.add(styles['animate-flash'])
    );

    const acts = target.closest('[data-role="acts"]') as HTMLElement;
    if (acts) {
      delete acts.dataset.markOffscreen;
    }
  }, [addAlert]);

  const onRemove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    const li = el.closest('li');
    if (li) {
      const { anchor } = li.dataset;
      if (anchor) removeMark(anchor);
      const acts = document.querySelector('[data-role="acts"]') as HTMLElement;
      if (acts) { delete acts.dataset.markOffscreen; }
    }
  }, [removeMark]);

  const onMouseEnter = useCallback((e: React.MouseEvent<HTMLLIElement>) => {
    const el = e.currentTarget;
    const { anchor } = el.dataset;
    const item = findItem(anchor);
    const target = item?.querySelector('[data-role="article"]');
    if (target) {
      target.classList.add(styles['peeking-target']);
      interObserver?.observe(target);
    }
  }, [interObserver]);

  const onMouseLeave = useCallback((e: React.MouseEvent<HTMLLIElement>) => {
    const cls = styles['peeking-target'];
    const acts = document.querySelector('[data-role="acts"]') as HTMLElement;
    document.querySelectorAll(`[data-role="article"].${cls}`).forEach(el => el.classList.remove(cls));
    delete acts.dataset.markOffscreen;
  }, []);

  const [act, article] = anchor.split('_', 2);

  return (
    <li className='flex items-center py-1' data-anchor={anchor} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <a className={MarkArticleCls} data-anchor={anchor} href={`#${anchor}`} onClick={onJump}>
        {act} {article}
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

const validateLocalMark = ({ anchor, title }: Mark) => {
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
                <ArrowLeftEndOnRectangleIcon className='stroke-current' height={20} />
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
      <ActCtrlPanel />
      <TagCtrlPanel />
      <MarkCtrlPanel />
    </div>
  );
}
