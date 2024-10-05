import * as R from 'ramda';
import { atom } from 'jotai';
import { removeFirst } from '@/lib/utils';

export type LawItem = {
  act: string,
  [key: string]: any,
};

export const VIEW_CTRL_KEYS = ['body'];

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

export type Mark = {
  anchor: string,
  title: string,
};
export const markPickingAtom = atom(false);
export const marksAtom = atom<Mark[]>([]);
export const addMarkAtom = atom(
  null,
  (get, set, update: Mark) => {
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

export const interObserverAtom = atom<IntersectionObserver | null>(null);
