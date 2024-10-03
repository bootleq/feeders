"use client"

import * as R from 'ramda';
import { useEffect, useMemo } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import { present } from '@/lib/utils';
import { dateRangeAtom, dateRejectedCountAtom, columnsAtom } from './store';

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
  const dateRange = useAtomValue(dateRangeAtom);
  const setDateRejected = useSetAtom(dateRejectedCountAtom);
  const columns = useAtomValue(columnsAtom);
  const colsClass = columnClassMapping[columns.length];
  const dateRangeKey = dateRange.join(',');

  const validFacts = useMemo(() => {
    if (dateRangeKey === ',') return facts;

    const [from, to] = dateRangeKey.split(',');
    return R.filter(({ date }) => {
      if (present(from) && /\d/.test(date[0]) && date < from) {
        return false;
      }
      if (present(to) && date > to) {
        return false;
      }
      return true;
    }, facts);
  }, [facts, dateRangeKey]);

  useEffect(() => {
    const diff = facts.length - validFacts.length;
    setDateRejected(diff);
  }, [facts, validFacts, setDateRejected]);

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
