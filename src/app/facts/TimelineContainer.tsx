"use client"

import * as R from 'ramda';
import { useEffect, useMemo } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import { present, blank } from '@/lib/utils';
import {
  textFilterAtom,
  dateRangeAtom,
  filterRejectedCountAtom,
  columnsAtom
} from './store';

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
        if (title?.includes(textFilter) || desc?.includes(textFilter)) {
          return true;
        } else {
          return false;
        }
      }

      return true;
    }, facts);
  }, [facts, textFilter, dateRangeKey]);

  useEffect(() => {
    const diff = facts.length - validFacts.length;
    setRejectCount(diff);
  }, [facts, validFacts, textFilter, setRejectCount]);

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
