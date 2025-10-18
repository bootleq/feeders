"use client"

import * as R from 'ramda';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useSetAtom, useAtomValue } from 'jotai';
import striptags from 'striptags';
import { present, blank, scrollAnywhereFix } from '@/lib/utils';
import {
  slugAtom,
  SLUG_PATTERN,
  textFilterAtom,
  dateRangeAtom,
  filterRejectedCountAtom,
  columnsAtom,
  zoomedFactAtom,
} from './store';
import { addAlertAtom } from '@/components/store';

import { findFactElement, clearMarkIndicators } from './utils';
import tlStyles from './timeline.module.scss';
import Timeline from './Timeline';
import Highlighter from './Highlighter';

const columnClassMapping: Record<number, string> = {
  1: 'md:max-w-3xl lg:max-w-5xl md:ml-3',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
};

export default function TimelineContainer({ facts, initialSlug }: {
  facts: any[],
  initialSlug: string,
}) {
  const setSlug = useSetAtom(slugAtom);
  const [isInitialZoom, setIsInitialZoom] = useState(present(initialSlug));
  const textFilter = useAtomValue(textFilterAtom);
  const dateRange = useAtomValue(dateRangeAtom);
  const setRejectCount = useSetAtom(filterRejectedCountAtom);
  const columns = useAtomValue(columnsAtom);
  const colsClass = columnClassMapping[columns.length];
  const dateRangeKey = dateRange.join(',');
  const pathname = usePathname();
  const setZoomedFact = useSetAtom(zoomedFactAtom);
  const lastAlertSlug = useRef('');
  const addAlert = useSetAtom(addAlertAtom);

  const validFacts = useMemo(() => {
    if (dateRangeKey === ',' && blank(textFilter)) return facts;

    const [from, to] = dateRangeKey.split(',');
    return R.filter(({ title, desc, date }) => {
      if (present(from) && date < from) {
        return false;
      }
      if (present(to) && date > to) {
        return false;
      }

      if (present(textFilter)) {
        const t = textFilter.toLowerCase();
        if (title?.toLowerCase().includes(t)) return true;
        if (desc && striptags(desc).toLowerCase().includes(t)) return true;
        return false;
      }

      return true;
    }, facts);
  }, [facts, textFilter, dateRangeKey]);

  const onMouseEnter = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setTimeout(() => {
      clearMarkIndicators();
    }, 500);
  }, []);

  const setZoomBySlug = useCallback((newSlug?: string) => {
    const zoom = newSlug?.match(SLUG_PATTERN);
    if (zoom) {
      const factId = Number.parseInt(zoom.pop() || '', 10);
      if (factId) {
        const fact = facts.find(f => f.id === factId);
        if (fact) {
          if (!isInitialZoom) {
            setZoomedFact(fact);
          }
          const target = findFactElement(`fact-${newSlug}`);
          target && target.scrollIntoView({ behavior: 'instant' });
        } else {
          setZoomedFact(null);
          const slugString = JSON.stringify(newSlug);
          if (lastAlertSlug.current !== slugString) {
            addAlert('error', <>無法跳到指定項目（<code>{slugString}</code> 可能已改名，或被移除）</>);
            lastAlertSlug.current = slugString;
          }
        }
      }
    } else {
      if (present(newSlug)) {
        setZoomedFact(null);
        const slugString = JSON.stringify(newSlug);
        if (newSlug === 'picks') {
          return;
        }
        if (lastAlertSlug.current !== slugString) {
          addAlert('error', <>網址不正確（<code>{slugString}</code> 無法辨識）</>);
          lastAlertSlug.current = slugString;
        }
      }
      setZoomedFact(null);
    }
  }, [facts, setZoomedFact, addAlert, isInitialZoom, lastAlertSlug]);

  const followHash = useCallback((e: HashChangeEvent) => {
    const hash = decodeURI(new URL(e.newURL).hash);

    if (hash.startsWith('#fact-')) {
      const target = findFactElement(hash.slice(1));
      if (target) {
        target.classList.remove(tlStyles['animate-flash']);
        window.setTimeout(() => {
          target.classList.add(tlStyles['animate-flash']);
          clearMarkIndicators();
        });
        scrollAnywhereFix();
        target.scrollIntoView();
      } else {
        addAlert('error', <>無法跳到選定日期（可能已被隱藏）</>);
      }
    }
  }, [addAlert]);

  useEffect(() => {
    window.addEventListener('hashchange', followHash);
    return () => {
      window.removeEventListener('hashchange', followHash);
    };
  }, [followHash]);

  useEffect(() => {
    const diff = facts.length - validFacts.length;
    setRejectCount(diff);
  }, [facts, validFacts, textFilter, setRejectCount]);

  useEffect(() => {
    const newSlug = pathname.split('/')[2] || '';
    const decodedSlug = decodeURI(newSlug);

    if (decodedSlug !== initialSlug) {
      setIsInitialZoom(false);
    }
    setSlug(decodedSlug);
    setZoomBySlug(decodedSlug);
  }, [pathname, initialSlug, setIsInitialZoom, setSlug, setZoomBySlug]);

  return (
    <div className={`w-full mx-auto px-0 grid gap-2 ${colsClass}`} onMouseEnter={onMouseEnter} data-nosnippet={isInitialZoom ? '' : undefined}>
      <Timeline col={1} facts={validFacts} isOnly={columns.length === 1} />

      {
        columns.slice(1).map((visible, idx) => (
          visible ?
            <Timeline key={idx} col={idx + 2} facts={validFacts} isSubView={true} />
            :
            <div key={idx}></div>
        ))
      }
      <Highlighter />
    </div>
  );
}
