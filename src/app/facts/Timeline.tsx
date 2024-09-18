"use client"

import * as R from 'ramda';
import { getTagColor } from './colors';
import cmsStyles from './cms.module.scss';

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
        <div className='leading-tight'>
          {title}
        </div>
        <Tags tags={tags} />
      </div>
      <div className={`text-opacity-90 pl-2 ${cmsStyles.mce}`}>
        {renderHtml(desc)}
      </div>
      <div className={`drop-shadow ${cmsStyles.line}`}></div>
    </div>
  );
}

export default function Timeline({ facts }: {
  facts: any[]
}) {
  return (
    <div className={`p-1 overflow-auto scrollbar-thin h-screen ${cmsStyles.timeline}`}>
      {facts.map(fact => <Fact key={fact.id} fact={fact} />)}
    </div>
  );
}
