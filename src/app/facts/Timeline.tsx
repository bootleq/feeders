"use client"

import * as R from 'ramda';
import { useCallback, useMemo } from 'react';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atomFamily, splitAtom } from 'jotai/utils';
import { present } from '@/lib/utils';
import { addAlertAtom } from '@/components/store';
import { viewCtrlAtom, tagsAtom, marksAtom, markPickingAtom, addMarkAtom } from './store';
import type { Tags } from './store';
import { getTagColor } from './colors';
import tlStyles from './timeline.module.scss';

function renderHtml(html: string, opts = {}) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

function TagList({ tags }: {
  tags: string[] | null
}) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <ul className='flex items-center text-xs'>
      {tags.map(tag => (
        <li key={tag} className={`${getTagColor(tag).join(' ')} rounded-full px-1 p-px mx-px border text-nowrap`}>
          {tag}
        </li>
      ))}
    </ul>
  );
}

const createAnyTagsHiddenAtom = (tagNames: string[]) => {
  return atom(get => {
    const tags = get(tagsAtom);
    const picked = R.pick(tagNames, tags);
    const hidden = R.values(picked).some(R.not);
    return hidden;
  });
};

function Fact({ fact }: {
  fact: any,
}) {
  const { id, date, title, desc, summary, origin, tags, weight } = fact;
  const anchor = `fact-${fact.date}_${fact.id}`;
  const datePadEnd = date.length < 10 ? <span className=''>{'\u00A0'.repeat(10 - date.length)}</span> : '';
  const anyTagHiddenAtom = useMemo(() => createAnyTagsHiddenAtom(tags || ['']), [tags]);
  const hidden = useAtomValue(anyTagHiddenAtom);

  if (hidden) {
    return null;
  }

  return (
    <div data-role='fact' data-anchor={anchor} className='px-1 pl-3 py-1 relative group rounded ring-slate-700/20'>
      <div className='flex items-center py-1 group/header group-hover:bg-slate-100 group-hover:ring ring-slate-200'>
        <div id={anchor} className='font-mono text-sm relative flex items-center whitespace-nowrap ml-px mr-1 px-1 rounded-md ring-1 text-red-950 bg-gradient-to-br from-amber-200 to-amber-200/80'>
          <a className='absolute flex items-center justify-center size-3 drop-shadow z-20 -left-[15px] bg-slate-100 border border-slate-400 rounded-full' href={`#${anchor}`}></a>
          <div data-role='fact-date'>
            {date}{datePadEnd}
          </div>
        </div>
        <div data-role='title' className='leading-tight text-balance text-center sm:text-start'>
          {title}
        </div>
        <a className='text-opacity-0 ml-auto px-1 rounded-full opacity-0 group-hover/header:opacity-100 hover:bg-amber-300/50 hover:scale-125 hover:-rotate-12' href={`#${anchor}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src='/assets/paper-clip.svg' alt='連結' width={16} height={16} />
        </a>
        <TagList tags={tags} />
      </div>

      <div data-role='desc' className={`text-opacity-90 pl-2 ${tlStyles.mce}`}>
        {renderHtml(desc)}
      </div>

      <div className='flex items-center flex-wrap'>
        {present(summary) &&
          <div data-role='summary' className={`relative text-opacity-90 p-1 py-0 ml-1 mt-1 w-fit ring-1 ${tlStyles.mce}`}>
            <div className={tlStyles['summary-mark']} title='摘要' aria-label='摘要'></div>
            {renderHtml(summary)}
          </div>
        }
        {present(origin) &&
          <div data-role='origin' className={`text-xs p-1 ml-1.5 w-fit text-zinc-700 ${tlStyles.origin}`}>
            {renderHtml(origin)}
          </div>
        }
      </div>

      <div className={`drop-shadow ${tlStyles.line}`}></div>
    </div>
  );
}

export default function Timeline({ facts }: {
  facts: any[]
}) {
  const viewCtrl = useAtomValue(viewCtrlAtom);
  const [markPicking, setMarkPicking] = useAtom(markPickingAtom);
  const marks = useAtomValue(marksAtom);
  const addMark = useSetAtom(addMarkAtom);
  const addAlert = useSetAtom(addAlertAtom);

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
    return facts.map(fact => <Fact key={fact.id} fact={fact} />);
  }, [facts]);

  const viewCtrlData = ['desc', 'summary', 'origin'].reduce((acc: Record<string, string>, key: string) => {
    if (!R.includes(key, viewCtrl)) {
      acc[`data-view-ctrl-${key}`] = 'hide';
    }
    return acc;
  }, {});
  // Make dataset like { data-view-ctrl-desc="hide" }

  const onClickProps = markPicking ? { onClick: onPickFact } : {};

  return (
    <div
      data-role='timeline'
      className={`p-1 overflow-auto scroll-smooth scroll-py-8 scrollbar-thin h-screen ${tlStyles.timeline} ${markPicking ? tlStyles['mark-picking'] : ''}`}
      {...onClickProps}
      {...viewCtrlData}
    >
      {Facts}
    </div>
  );
}
