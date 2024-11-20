"use client"

import * as R from 'ramda';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atomFamily, splitAtom } from 'jotai/utils';
import { present } from '@/lib/utils';
import { addAlertAtom } from '@/components/store';
import Html from '@/components/Html';
import {
  VIEW_CTRL_KEYS,
  viewCtrlAtom,
  tagsAtom,
  marksAtom,
  markPickingAtom,
  addMarkAtom,
  timelineInterObserverAtom,
  zoomedFactAtom,
} from './store';
import type { Tags } from './store';
import FactTagList from './FactTagList';
import { getTagColor } from './colors';
import tlStyles from './timeline.module.scss';
import { ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

const createTagsHiddenAtom = (tagNames: string[]) => {
  return atom(get => {
    const tags = get(tagsAtom);
    const picked = R.pick(tagNames, tags);
    const hidden = R.values(picked).every(R.not);
    return hidden;
  });
};

const factHeaderIconCls = 'text-opacity-0 px-1 rounded-full opacity-0 group-hover/header:opacity-100 hover:bg-amber-300/50 hover:scale-125';

function Fact({ fact, isSubView }: {
  fact: any,
  isSubView?: boolean,
}) {
  const { id, date, title, desc, summary, origin, tags, weight } = fact;
  const anchor = `fact-${fact.date}_${fact.id}`;
  const datePadEnd = date.length < 10 ? <span className=''>{'\u00A0'.repeat(10 - date.length)}</span> : '';
  const allTagsHiddenAtom = useMemo(() => createTagsHiddenAtom(tags || ['']), [tags]);
  const hidden = useAtomValue(allTagsHiddenAtom);
  const setZoom = useSetAtom(zoomedFactAtom);

  const onSetZoom = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setZoom(fact);
  }, [setZoom, fact]);

  if (hidden) {
    return null;
  }

  const idProp = isSubView ? {} : { id: anchor };

  return (
    <div data-role='fact' data-anchor={anchor} className='px-1 pl-3 py-1 relative group rounded ring-slate-700/20'>
      <div className='flex items-center py-1 group/header group-hover:bg-slate-100 group-hover:ring ring-slate-200'>
        <div {...idProp} className='font-mono text-sm relative flex items-center whitespace-nowrap ml-px mr-1 px-1 rounded-md ring-1 text-red-950 bg-gradient-to-br from-amber-200 to-amber-200/80'>
          <a className='absolute flex items-center justify-center size-3 drop-shadow z-20 -left-[15px] bg-slate-100 border border-slate-400 rounded-full' href={`#${anchor}`}></a>
          <div data-role='fact-date'>
            {date}{datePadEnd}
          </div>
        </div>
        <div data-role='title' className='leading-tight text-balance text-center sm:text-start'>
          {title}
        </div>
        <a href={`#${anchor.replace('fact-', 'zoom-')}`} className={`ml-auto ${factHeaderIconCls}`} onClick={onSetZoom}>
          <ArrowsPointingOutIcon className='stroke-slate-700 stroke-2' height={16} />
        </a>
        <a className={`mr-1 hover:-rotate-12 ${factHeaderIconCls}`} href={`#${anchor}`}>
          <img src='/assets/paper-clip.svg' alt='連結' width={16} height={16} />
        </a>
        <FactTagList tags={tags} />
      </div>

      <div data-role='desc' className={`text-opacity-90 pl-2 break-words ${tlStyles.mce}`}>
        <Html html={desc} />
      </div>

      <div className='flex items-center flex-wrap'>
        {present(summary) &&
          <div data-role='summary' className={`relative text-opacity-90 p-1 py-0 ml-1 mt-1 w-fit ring-1 ${tlStyles.mce}`}>
            <div className={tlStyles['summary-mark']} title='摘要' aria-label='摘要'></div>
            <Html html={summary} />
          </div>
        }
        {present(origin) &&
          <div data-role='origin' className={`text-xs p-1 ml-1.5 w-fit text-zinc-700 ${tlStyles.origin}`}>
            <Html html={origin} />
          </div>
        }
      </div>

      <div className={`drop-shadow ${tlStyles.line}`}></div>
    </div>
  );
}

function MarkOffscreenIndicators({ direct }: {
  direct: 'up' | 'down'
}) {
  const dirWord = direct === 'up' ? '上方' : '下方';
  return (
    <div className={tlStyles[`mark-offscreen-${direct}`]} aria-label={`目標在畫面外（${dirWord}）`}>
      <div className='animate-bounce'>
        <img className={direct === 'up' ? '-rotate-90' : 'rotate-90'} src='/assets/hand-pointer.svg' alt={`在${dirWord}`} width={96} height={96} />
      </div>
    </div>
  );
}

export default function Timeline({ facts, isSubView = false }: {
  facts: any[],
  isSubView?: boolean,
}) {
  const ref = useRef<HTMLDivElement>(null);
  const viewCtrl = useAtomValue(viewCtrlAtom);
  const [markPicking, setMarkPicking] = useAtom(markPickingAtom);
  const marks = useAtomValue(marksAtom);
  const addMark = useSetAtom(addMarkAtom);
  const addAlert = useSetAtom(addAlertAtom);
  const setInterObserver = useSetAtom(timelineInterObserverAtom);
  const [markOffscreen, setMarkOffscreen] = useState<null | 'up' | 'down'>(null);

  useEffect(() => {
    if (isSubView) return;

    const root = ref.current;
    const observer = new IntersectionObserver((entries) => {
      if (!root) return;
      entries.forEach((e) => {
        if (!e.rootBounds) return;
        if (!e.isIntersecting) {
          if (e.boundingClientRect.bottom <= e.rootBounds.top) {
            root.dataset.markOffscreen = 'up';
          } else {
            root.dataset.markOffscreen = 'down';
          }
        }
        observer.unobserve(e.target);
      });
    }, {
      root,
      threshold: 1.0
    });
    setInterObserver(observer);

    return () => {
      observer.disconnect();
      setInterObserver(null);
    };
  }, [setInterObserver, isSubView]);

  const onPickFact = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.target as HTMLElement;
    const fact = el.closest('[data-role="fact"]') as HTMLElement;
    if (!fact) return;

    const anchor = fact.dataset.anchor;
    const title = fact.querySelector('[data-role="title"]')?.textContent;

    if (R.any(R.propEq(anchor, 'anchor'), marks)) {
      addAlert('info', <>已經加入過了，不能重複</>);
      return;
    }

    if (anchor && title) {
      addMark({ anchor, title })
      setMarkPicking(false);
    } else {
      addAlert('error', <>無法取得連結或標題</>);
    }
  }, [marks, addMark, setMarkPicking, addAlert]);

  const Facts = useMemo(() => {
    return facts.map(fact => <Fact key={fact.id} fact={fact} isSubView={isSubView} />);
  }, [facts, isSubView]);

  const viewCtrlData = VIEW_CTRL_KEYS.reduce((acc: Record<string, string>, key: string) => {
    if (!R.includes(key, viewCtrl)) {
      acc[`data-view-ctrl-${key}`] = 'hide';
    }
    return acc;
  }, {});
  // Make dataset like { data-view-ctrl-desc="hide" }

  const markPickingInMainView = (markPicking && !isSubView);
  const onClickProps = markPickingInMainView ? { onClick: onPickFact } : {};

  const rootClassName = [
    'relative p-1 overflow-auto scroll-smooth scroll-py-8 scrollbar-thin h-screen',
    tlStyles.timeline,
    markPickingInMainView ? tlStyles['mark-picking'] : '',
    isSubView ? 'hidden md:block' : '',
  ].join(' ');

  return (
    <div
      ref={ref}
      data-role='timeline'
      className={rootClassName}
      {...onClickProps}
      {...viewCtrlData}
    >
      {!isSubView && <MarkOffscreenIndicators direct='up' />}
      {Facts}
      {!isSubView && <MarkOffscreenIndicators direct='down' />}
    </div>
  );
}
