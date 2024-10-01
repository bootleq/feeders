"use client"

import * as R from 'ramda';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { format } from '@/lib/date-fp';
import styles from './article.module.scss';

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
        <div className={styles.content}>
          { content }
        </div>
      </article>
    </>
  );
}
