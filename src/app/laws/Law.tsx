"use client"

import * as R from 'ramda';
import { useMemo } from 'react';
import { atom, useAtomValue } from 'jotai';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Html from '@/components/Html';
import { tagsAtom, ACT_ABBRS } from './store';
import styles from './laws.module.scss';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

function TagList({ tags }: {
  tags: string[] | null
}) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <ul className='float-right flex items-center flex-wrap gap-y-2 justify-end my-1 py-1 text-sm ml-auto'>
      {tags.map(tag => (
        <li key={tag} className={`rounded-full py-px px-1 mx-1 border text-nowrap ring-1 ring-slate-500`}>
          {tag}
        </li>
      ))}
    </ul>
  );
}

const createTagsHiddenAtom = (tagNames: string[]) => {
  return atom(get => {
    const tags = get(tagsAtom);
    const picked = R.pick(tagNames, tags);
    const hidden = R.values(picked).every(R.not);
    return hidden;
  });
};

export default function Law({ item }: {
  item: any,
}) {
  const searchParams = useSearchParams();
  const openJudges = searchParams.has('judge') ? !!searchParams.get('judge') : false;
  const { id, act, article, title, link, summary, judgements, penalty, tags, effectiveAt } = item;
  const actAbbr = ACT_ABBRS[act] || '';
  const anchor = `${actAbbr}_${article}`;
  const allTagsHiddenAtom = useMemo(() => createTagsHiddenAtom(tags || ['']), [tags]);
  const hidden = useAtomValue(allTagsHiddenAtom);

  if (hidden) {
    return null;
  }

  return (
    <li data-role='law' data-anchor={anchor} data-title={title} className='p-1 my-5 w-full relative group rounded ring-2 ring-slate-600/40'>
      <div className='flex flex-wrap gap-y-1 items-center justify-start group/header group-hover:bg-slate-100 group-hover:ring ring-slate-200'>
        <a id={anchor} data-role='article' className='font-mono text-base hover:text-sky-700 hover:font-bold whitespace-nowrap mr-px px-1 rounded-md' href={`#${anchor}`}>
          {article}.
        </a>

        <div data-role='title' className='flex items-center leading-tight sm:text-start'>
          <strong className='mr-2 text-lg'>{title}</strong>
          <Link href={link} target='_blank' className='hover:bg-amber-300/50 hover:scale-125'>
            <ArrowTopRightOnSquareIcon className='stroke-current' height={16} />
          </Link>
        </div>

        <a className='text-opacity-0 ml-auto sm:ml-1 mr-1 px-1 rounded-full opacity-90 group-hover/header:opacity-100 hover:bg-amber-300/50 hover:scale-125 hover:-rotate-12' href={`#${anchor}`}>
          <img src='/assets/paper-clip.svg' alt='連結' width={16} height={16} />
        </a>

        <Html data-role='penalty' html={penalty} className={`ml-0 sm:ml-auto px-1 text-slate-200 bg-slate-700/60 hover:bg-red-900/80 text-sm ${styles.penalty}`} />
      </div>

      <div data-role='body' className={styles.body}>
        <div className='ml-2'>
          <div data-role='summary' className={`text-opacity-90 p-1 float-left ${styles.mce}`}>
            <Html html={summary} />
          </div>
          <TagList tags={tags} />
        </div>

        { judgements &&
          <details className={`ml-2 clear-both break-words ${styles.judgements}`} open={openJudges}>
            <summary className='flex items-center cursor-pointer text-red-900/80'>
              <img src='/assets/gavel.svg' alt='法槌' width={20} height={20} className='-scale-x-100' />
              判例
            </summary>
            <Html html={judgements} className='p-1 mb-2 text-sm' />
          </details>
        }
      </div>
    </li>
  );
}
