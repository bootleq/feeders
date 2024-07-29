import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';

type WorldCtrlAtom = {
  mode?: 'world' | 'area'
}

export const rawWorldCtrlAtom = atom<WorldCtrlAtom>({ mode: 'world' });

export const worldCtrlAtom = atom(
  (get) => get(rawWorldCtrlAtom),
  (get, set, update: WorldCtrlAtom) => {
    set(rawWorldCtrlAtom, { ...get(rawWorldCtrlAtom), ...update });
  }
);
