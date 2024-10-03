import * as R from 'ramda';
import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';
import { removeFirst } from '@/lib/utils';

export const VIEW_CTRL_KEYS= ['desc', 'summary', 'origin'];

export const viewCtrlAtom = atom(VIEW_CTRL_KEYS);
export const toggleViewCtrlAtom = atom(
  get => get(viewCtrlAtom),
  (get, set, update: string) => {
    const prev = get(viewCtrlAtom);
    if (R.includes(update, prev)) {
      set(viewCtrlAtom, R.without([update], prev));
    } else {
      set(viewCtrlAtom, [ ...prev, update ]);
    }
  }
);

export const columnsAtom = atom<boolean[]>([true, false]);

export type Tags = Record<string, boolean>;
export const tagsAtom = atom<Tags>({});
export const mergeTagsAtom = atom(
  get => get(tagsAtom),
  (get, set, update: Tags) => {
    set(tagsAtom, { ...get(tagsAtom), ...update });
  }
);
export const togglaAllTagsAtom = atom(
  null,
  (get, set, update: boolean) => {
    set(tagsAtom, R.mapObjIndexed(R.always(update)))
  }
);

export type DateRange = [string, string];
export const dateRangeAtom = atom<DateRange>(['', '']);
export const dateRejectedCountAtom = atom(0);

export type FactMark = {
  anchor: string,
  title: string,
};
export const markPickingAtom = atom(false);
export const marksAtom = atom<FactMark[]>([]);
export const addMarkAtom = atom(
  null,
  (get, set, update: FactMark) => {
    set(marksAtom, R.pipe(
      R.append(update),
      R.sortBy(R.prop('anchor'))
    ));
  }
);
export const removeMarkAtom = atom(
  null,
  (get, set, anchor: string) => {
    set(marksAtom, removeFirst(R.propEq(anchor, 'anchor')));
  }
);
export const peekingMarkAtom = atom<string | null>(null);

export const timelineInterObserverAtom = atom<IntersectionObserver | null>(null);
