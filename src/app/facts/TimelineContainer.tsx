"use client"

import * as R from 'ramda';
import { useCallback, useEffect, useMemo } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import { present, blank } from '@/lib/utils';
import {
  textFilterAtom,
  dateRangeAtom,
  filterRejectedCountAtom,
  columnsAtom,
  zoomedFactAtom,
} from './store';
import { addAlertAtom } from '@/components/store';

import { findFact } from './utils';
import tlStyles from './timeline.module.scss';
import Timeline from './Timeline';

const columnClassMapping: Record<number, string> = {
  1: '',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
};

export default function TimelineContainer({ facts }: {
  facts: any[],
}) {
  const textFilter = useAtomValue(textFilterAtom);
  const dateRange = useAtomValue(dateRangeAtom);
  const setRejectCount = useSetAtom(filterRejectedCountAtom);
  const columns = useAtomValue(columnsAtom);
  const colsClass = columnClassMapping[columns.length];
  const dateRangeKey = dateRange.join(',');
  const setZoomedFact = useSetAtom(zoomedFactAtom);
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
        if (title?.toLowerCase().includes(t) || desc?.toLowerCase().includes(t)) {
          return true;
        } else {
          return false;
        }
      }

      return true;
    }, facts);
  }, [facts, textFilter, dateRangeKey]);

  const setZoomByHash = useCallback((hash: string) => {
    if (hash.startsWith('#zoom-')) {
      const zoom = hash.match(/^#zoom-.+_(\d+)$/);
      if (zoom) {
        const factId = Number.parseInt(zoom.pop() || '', 10);
        if (factId) {
          const fact = facts.find(f => f.id === factId);
          if (fact) {
            setZoomedFact(fact);
            const anchor = hash.replace('#zoom-', '#fact-');
            const target = document.querySelector(anchor);
            target && target.scrollIntoView({ behavior: 'instant' });
          }
        }
      }
    } else {
      setZoomedFact(null);
    }
  }, [facts, setZoomedFact]);

  const followHash = useCallback((e: HashChangeEvent) => {
    const { hash } = new URL(e.newURL);

    setZoomByHash(hash);

    if (hash.startsWith('#fact-')) {
      const target = findFact(hash.slice(1));
      if (target) {
        target.classList.remove(tlStyles['animate-flash']);
        window.setTimeout(() =>
          target.classList.add(tlStyles['animate-flash'])
        );
        target && target.scrollIntoView();
      } else {
        addAlert('error', <>無法跳到選定日期（可能已被隱藏）</>);
      }
    }
  }, [addAlert, setZoomByHash]);

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
    const hash = window.location.hash;
    if (hash.startsWith('#zoom-')) {
      setZoomByHash(hash);
    }
  }, [setZoomByHash]);

  return (
    <div className={`w-full mx-auto px-0 grid gap-2 ${colsClass}`}>
      <Timeline facts={validFacts} />
      {
        columns.slice(1).map((visible, idx) => (
          visible ?
            <Timeline key={idx} facts={validFacts} isSubView={true} />
            :
            <div key={idx}></div>
        ))
      }
    </div>
  );
}
