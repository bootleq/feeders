"use client"

import * as R from 'ramda';
import { useMemo } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { present } from '@/lib/utils';
import { viewCtrlAtom } from './store';
import { getTagColor } from './colors';
import tlStyles from './timeline.module.scss';

function renderHtml(html: string, opts = {}) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

function Tags({ tags }: {
  tags: string[] | null
}) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <ul className='flex items-center text-xs ml-auto'>
      {tags.map(tag => (
        <li key={tag} className={`${getTagColor(tag).join(' ')} rounded-full px-1 p-px mx-px border text-nowrap`}>
          {tag}
        </li>
      ))}
    </ul>
  );
}

function Fact({ fact }: {
  fact: any,
}) {
  const { id, date, title, desc, summary, origin, tags, weight } = fact;
  const anchor = `fact-${fact.date}_${fact.id}`;
  const datePadEnd = date.length < 10 ? <span className=''>{'\u00A0'.repeat(10 - date.length)}</span> : '';

  return (
    <div className='px-1 pl-3 py-1 relative group rounded ring-slate-700/20'>
      <div className='flex items-center py-1 group-hover:bg-slate-100 group-hover:ring ring-slate-200'>
        <div id={anchor} className='font-mono text-sm relative flex items-center whitespace-nowrap ml-px mr-1 px-1 rounded-md ring-1 text-red-950 bg-gradient-to-br from-amber-200 to-amber-200/80'>
          <a className='absolute flex items-center justify-center size-3 drop-shadow z-20 -left-[15px] text-opacity-0 group-hover:text-opacity-100 text-black bg-slate-100 border border-slate-400 rounded-full' href={`#${anchor}`}>#</a>
          <div>
            {date}{datePadEnd}
          </div>
        </div>
        <div className='leading-tight text-balance text-center sm:text-start'>
          {title}
        </div>
        <Tags tags={tags} />
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

  return (
    <div
      className={`p-1 overflow-auto scrollbar-thin h-screen ${tlStyles.timeline}`}
      {...viewCtrlData}
    >
      {Facts}
    </div>
  );
}
