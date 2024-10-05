"use client"

import * as R from 'ramda';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { format } from '@/lib/date-fp';
import styles from './article.module.scss';

function Fact({ fact }: {
  fact: any,
}) {
  const { id, date, title } = fact;
  const anchor = `fact-${fact.date}_${fact.id}`;
  const datePadEnd = date.length < 10 ? <span className=''>{'\u00A0'.repeat(10 - date.length)}</span> : '';

  return (
    <li className='flex items-center my-2 w-fit'>
      <div className='font-mono text-sm whitespace-nowrap ml-px mr-1 px-1 rounded-md ring-1 text-red-950 bg-gradient-to-br from-amber-200 to-amber-200/80 hover:ring'>
        <Link href={`/facts/#${anchor}`}>
          {date}{datePadEnd}
        </Link>
      </div>
      <div data-role='title' className='leading-tight text-balance text-center sm:text-start'>
        {title}
      </div>
    </li>
  );
}

export default function Article({ post }: {
  post: any,
}) {
  const { id, title, content, publishedAt, modifiedAt, editors, tags, facts } = post;

  return (
    <>
      <div className={styles.meta}>
        <div className='font-mono text-sm'>
          <span className='mr-2'>
            刊出日期
          </span>
          <time className=''>{format({}, 'yyyy/M/d', publishedAt)}</time>
        </div>

        {modifiedAt &&
          <div className='font-mono text-sm'>
            <span className='mr-2'>
              最後修改
            </span>
            <time className=''>{format({}, 'yyyy/M/d', modifiedAt)}</time>
          </div>
        }

        <div className='text-sm my-1 mb-3'>
          <div className='whitespace-pre'>
            {editors}
          </div>
        </div>

        <div className='text-sm my-1'>
          <Link href='#related-facts' className='flex items-center justify-end w-fit ml-auto rounded-lg hover:bg-white'>
            <img src='/assets/paper-clip.svg' alt='連結' width={16} height={16} />
            相關事實
          </Link>
        </div>

        {tags?.length &&
          <ul className='my-2 flex items-center justify-end'>
            {tags.map((tag: string) => (
              <li key={tag} className='text-sm p-px px-1 m-1 rounded-full ring-1 ring-offset-1 ring-slate-600'>
                {tag}
              </li>
            ))}
          </ul>
        }
      </div>

      <article className={styles.article}>
        <div className={styles.content}>
          { content }
        </div>
      </article>

      <footer className='p-2 py-4 mb-4 border-t-2'>
        <h2 id='related-facts' className='text-xl'>相關事實</h2>
        {facts.length &&
          <ul>
            {
              facts.map((fact: any) => (
                <Fact key={fact.id} fact={fact} />
              ))
            }
          </ul>
        }
      </footer>
    </>
  );
}
