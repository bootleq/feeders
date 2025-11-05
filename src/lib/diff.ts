import * as R from 'ramda';
import { create } from 'jsondiffpatch';
import type { Delta, ModifiedDelta, ObjectDelta } from 'jsondiffpatch';

const instance = create();

type Obj = Record<string, any>;

export function diffForm(oldObj: Obj, newObj: Obj) {
  const delta = instance.diff(oldObj, newObj);

  if (R.isNil(delta)) {
    return null;
  }

  const changeset = Object.entries(delta).reduce((acc, deltaPair) => {
    const [key, deltaEntry] = deltaPair as [string, ObjectDelta];

    acc.old[key] = oldObj[key];
    acc.new[key] = newObj[key];
    return acc;
  }, {
    old: {} as Obj,
    new: {} as Obj,
  });

  return changeset;
}
