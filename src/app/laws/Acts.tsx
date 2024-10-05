"use client"

import * as R from 'ramda';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { present } from '@/lib/utils';
import { addAlertAtom } from '@/components/store';
import type { Tags, LawItem } from './store';
import {
  VIEW_CTRL_KEYS,
  viewCtrlAtom,
  marksAtom,
  markPickingAtom,
  addMarkAtom,
  interObserverAtom,
} from './store';
import styles from './laws.module.scss';
import Law from './Law';

function MarkOffscreenIndicators({ direct }: {
  direct: 'up' | 'down'
}) {
  const dirWord = direct === 'up' ? '上方' : '下方';
  return (
    <div className={styles[`mark-offscreen-${direct}`]} aria-label={`目標在畫面外（${dirWord}）`}>
      <div className='animate-bounce'>
        <img className={direct === 'up' ? '-rotate-90' : 'rotate-90'} src='/assets/hand-pointer.svg' alt={`在${dirWord}`} width={96} height={96} />
      </div>
    </div>
  );
}

export default function Acts({ acts }: {
  acts: Record<string, LawItem[]>,
}) {
  const ref = useRef<HTMLDivElement>(null);
  const viewCtrl = useAtomValue(viewCtrlAtom);
  const [markPicking, setMarkPicking] = useAtom(markPickingAtom);
  const marks = useAtomValue(marksAtom);
  const addMark = useSetAtom(addMarkAtom);
  const addAlert = useSetAtom(addAlertAtom);
  const setInterObserver = useSetAtom(interObserverAtom);
  const [markOffscreen, setMarkOffscreen] = useState<null | 'up' | 'down'>(null);

  useEffect(() => {
    const root = ref.current;
    const observer = new IntersectionObserver((entries) => {
      if (!root) return;
      entries.forEach((e) => {
        console.log('interseet', e);
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
  }, [setInterObserver]);

  const onPickItem = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.target as HTMLElement;
    const law = el.closest('[data-role="law"]') as HTMLElement;
    if (!law) return;

    const anchor = law.dataset.anchor;
    const pickableTitle = law.dataset.pickableTitle;

    if (R.any(R.propEq(anchor, 'anchor'), marks)) {
      addAlert('info', <>已經加入過了，不能重複</>);
      return;
    }

    if (anchor && pickableTitle) {
      addMark({ anchor, title: pickableTitle })
      setMarkPicking(false);
    } else {
      addAlert('error', <>無法取得連結或標題</>);
    }
  }, [marks, addMark, setMarkPicking, addAlert]);

  const viewCtrlData = VIEW_CTRL_KEYS.reduce((acc: Record<string, string>, key: string) => {
    if (!R.includes(key, viewCtrl)) {
      acc[`data-view-ctrl-${key}`] = 'hide';
    }
    return acc;
  }, {});
  // Make dataset like { data-view-ctrl-body="hide" }

  const onClickProps = markPicking ? { onClick: onPickItem } : {};
  const rootClassName = [
    'relative p-1 max-w-screen-2xl overflow-auto scroll-smooth scroll-py-8 scrollbar-thin h-screen',
    styles.acts,
    markPicking ? styles['mark-picking'] : '',
  ].join(' ');

  return (
    <div
      ref={ref}
      data-role='acts'
      className={rootClassName}
      {...onClickProps}
      {...viewCtrlData}
    >
      <MarkOffscreenIndicators direct='up' />
      <ul>
        {
          Object.entries(acts).map(([act, laws]) => (
            <li key={act}>
              <div className='flex items-center text-lg p-1 pr-5 my-1 mb-2 ring ring-slate-800'>
                <img src='/assets/dictionary.svg' alt='法律' width={18} height={18} className='mr-1' />
                <strong>{act}</strong>
              </div>

              <ul className='pb-2'>
                {laws.map((law: any) => (
                  <Law key={law.id} item={law} />
                ))}
              </ul>
            </li>
          ))
        }
      </ul>
      <MarkOffscreenIndicators direct='down' />
    </div>
  );
};