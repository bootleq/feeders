"use client"

import * as R from 'ramda';
import { useMemo } from 'react';
import { atom, useAtomValue } from 'jotai';
import Link from 'next/link';
import { tagsAtom } from './store';
import styles from './laws.module.scss';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

function Html({ html, ...props }: {
  html: string,
  [key: string]: any,
}) {
  return <div dangerouslySetInnerHTML={{ __html: html }} {...props} />;
};

function TagList({ tags }: {
  tags: string[] | null
}) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <ul className='flex items-center my-1 text-sm ml-auto'>
      {tags.map(tag => (
        <li key={tag} className={`rounded-full py-px px-1 mx-1 border text-nowrap ring-1 ring-slate-500`}>
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

export default function Law({ item }: {
  item: any,
}) {
  const { id, act, article, title, link, summary, judgements, penalty, tags, effectiveAt } = item;
  const anchor = `law-${item.id}`;
  const pickableTitle = `${act} ${article} $$ ${title}`;
  const anyTagHiddenAtom = useMemo(() => createAnyTagsHiddenAtom(tags || ['']), [tags]);
  const hidden = useAtomValue(anyTagHiddenAtom);

  if (hidden) {
    return null;
  }

  return (
    <li data-role='law' data-anchor={anchor} data-pickable-title={pickableTitle} className='p-1 my-2 ml-2 relative group rounded ring-1 ring-slate-600/20'>
      <div className='flex flex-wrap gap-y-1 items-center justify-center group/header group-hover:bg-slate-100 group-hover:ring ring-slate-200'>
        <a id={anchor} data-role='article' className='font-mono text-base hover:text-sky-700 hover:font-bold whitespace-nowrap mr-px px-1 rounded-md' href={`#${anchor}`}>
          {article}.
        </a>

        <div data-role='title' className='flex items-center leading-tight text-balance text-center sm:text-start'>
          <strong className='mr-2 text-lg'>{title}</strong>
          <Link href={link} target='_blank' className='hover:bg-amber-300/50 hover:scale-125'>
            <ArrowTopRightOnSquareIcon className='stroke-current' height={16} />
          </Link>
        </div>

        <a className='text-opacity-0 ml-2 px-1 rounded-full opacity-0 group-hover/header:opacity-100 hover:bg-amber-300/50 hover:scale-125 hover:-rotate-12' href={`#${anchor}`}>
          <img src='/assets/paper-clip.svg' alt='連結' width={16} height={16} />
        </a>

        <Html html={penalty} className={`ml-auto px-1 text-slate-200 bg-slate-700/60 hover:bg-red-900/80 text-sm ${styles.penalty}`} />
      </div>

      <div data-role='body' className={styles.body}>
        <div className='flex items-start ml-2'>
          <div data-role='summary' className={`text-opacity-90 p-1 ${styles.mce}`}>
            <Html html={summary} />
          </div>

          <TagList tags={tags} />
        </div>

        { judgements &&
          <details className={`ml-2 break-words ${styles.judgements}`}>
            <summary className='flex items-center cursor-pointer'>
              <img src='/assets/gavel.svg' alt='法槌' width={20} height={20} className='-scale-x-100' />
              判例
            </summary>
            <Html html={judgements} className='p-1 mb-2 text-sm ring' />
          </details>
        }
      </div>
    </li>
  );
}
