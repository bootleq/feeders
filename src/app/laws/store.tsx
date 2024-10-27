import * as R from 'ramda';
import { atom } from 'jotai';
import { removeFirst } from '@/lib/utils';

export type LawItem = {
  act: string,
  [key: string]: any,
};

export const VIEW_CTRL_KEYS = ['body', 'penalty'];

export const ACT_ABBRS: Record<string, string> = {
  '廢棄物清理法': '廢清法',
  '刑法': '刑法',
  '動物保護法': '動保法',
  '社會秩序維護法': '社維法',
  '道路交通管理處罰條例': '道交條例',
  '公寓大廈管理條例': '公寓大廈條例',
  '臺北市公園管理自治條例': '北市公園自治',
  '新北市動物保護自治條例': '新北動保自治',
  '國立政治大學犬隻管理原則': '政大犬管原則'
};

export const ACTS = Object.keys(ACT_ABBRS);

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
