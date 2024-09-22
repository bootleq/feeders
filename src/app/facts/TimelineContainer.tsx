"use client"

import * as R from 'ramda';
import { useAtomValue } from 'jotai';
import { columnsAtom } from './store';
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
  const columns = useAtomValue(columnsAtom);
  const colsClass = columnClassMapping[columns.length];

  return (
    <div className={`w-full mx-auto px-0 grid gap-2 ${colsClass}`}>
      <Timeline facts={facts} />
      {
        columns.slice(1).map((visible, idx) => (
          visible ?
            <Timeline key={idx} facts={facts} isSubView={true} />
            :
            <div key={idx}></div>
        ))
      }
    </div>
  );
}
