"use client"

import * as R from 'ramda';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { format } from '@/lib/date-fp';
import styles from './article.module.scss';

function Html({ html, ...props }: {
  html: string,
  [key: string]: any,
}) {
  return <div dangerouslySetInnerHTML={{ __html: html }} {...props} />;
};

export default function Article({ post }: {
  post: any,
}) {
  const { id, title, content, publishedAt } = post;

  return (
    <>
      <div className={styles.meta}>
        <time className='font-mono'>{format({}, 'yyyy/M/d', publishedAt)}</time>
      </div>
      <article className={styles.article}>

        <Html html={content} className={styles.content} />
      </article>
    </>
  );
}
