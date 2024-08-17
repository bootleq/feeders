import * as R from 'ramda';
import { create } from 'jsondiffpatch';
import type { Delta, ModifiedDelta, ObjectDelta } from 'jsondiffpatch';

const instance = create();

export function diffForm(oldObj: object, newObj: object) {
  const delta = instance.diff(oldObj, newObj);

  if (R.isNil(delta)) {
    return null;
  }

  const changeset = Object.entries(delta).reduce((acc, deltaPair) => {
    const [key, deltaEntry] = deltaPair as [string, ObjectDelta];

    // Only support shallow object of ModifiedDelta
    // https://github.com/benjamine/jsondiffpatch/blob/master/docs/deltas.md
    if (!Array.isArray(deltaEntry)) throw new Error(`Unexpected delta ${deltaPair}`);
    if (deltaEntry.length !== 2) throw new Error(`Unexpected delta ${deltaPair}`);

    acc.old[key] = deltaEntry[0];
    acc.new[key] = deltaEntry[1];
    return acc;
  }, {
    old: {} as { [key: string]: any },
    new: {} as { [key: string]: any },
  });

  return changeset;
}
