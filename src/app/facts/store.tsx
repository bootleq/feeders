import * as R from 'ramda';
import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';

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
