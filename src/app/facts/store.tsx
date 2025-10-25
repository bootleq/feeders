import * as R from 'ramda';
import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { removeFirst } from '@/lib/utils';
import type { RecentPicksItemProps } from '@/models/facts';

export const VIEW_CTRL_KEYS= ['desc', 'summary', 'origin', 'tags'];
export const SLUG_PATTERN = /^[\d\- ~BC]+_(\d+)$/;

export const slugAtom = atom('');

const invalidDate = new Date(NaN);

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

export const columnsAtom = atom<boolean[]>([true]);

export type Fact = {
  id: number,
  status: string,
  date: string,
  title: string,
  desc: string,
  summary: string,
  origin: string,
  tags: string,
  insights: number[],
}

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

export const textFilterAtom = atom('');
export const textHighlightAtom = atom(true);
export type DateRange = [string, string];
export const dateRangeAtom = atom<DateRange>(['', '']);
export const filterRejectedCountAtom = atom(0);

export const highlightRangesAtomFamily = atomFamily((col: number) =>
  atom<Range[]>([])
);
export const allHighlighRangesAtom = atom((get) => {
  const cols = [1, 2, 3, 4, 5];
  let allRanges: Range[] = [];
  cols.forEach((col) => {
    const ranges = get(highlightRangesAtomFamily(col));
    allRanges = allRanges.concat(ranges);
  });
  return allRanges;
});

export const filterByMarksAtom = atom(false);
export const currentMarksAtom = atom(
  (get) => {
    const pick = get(pickAtom);
    if (pick) {
      return pick.factIds;
    } else {
      const localMarks = get(localMarksAtom);
      return localMarks;
    }
  }
);

export const markPickingAtom = atom(false);
export const peekingMarkAtom = atom<string | null>(null);
export const latestAddMarkAtom = atom<number | null>(null);

export const localMarksAtom = atom<number[]>([]);
export const addLocalMarkAtom = atom(
  null,
  (get, set, factId: number) => {
    set(localMarksAtom, R.append(factId));
  }
);
export const removeLocalMarkAtom = atom(
  null,
  (get, set, id: number) => {
    set(localMarksAtom, removeFirst(R.equals(id)));
  }
);

export type PicksMode = 'index' | 'item' | 'my' | 'edit' | '';
export const picksAtom = atom<RecentPicksItemProps[]>([]);
export const loadingPicksAtom = atom(false);
export const initialPickLoadedAtom = atom<string[]>([]);
export const picksModeAtom = atom<PicksMode>('');
export const myPicksAtom = atom<RecentPicksItemProps[]>([]);
export const pickAtom = atom<RecentPicksItemProps | null>(null);
export const removePickMarkAtom = atom(
  null,
  (get, set, factId: number) => {
    const oldIds = get(pickAtom)?.factIds;
    if (oldIds) {
      const newIds = removeFirst(R.equals(factId))(oldIds);
      set(pickAtom, R.assoc('factIds', newIds));
    }
  }
);
export const addPickMarkAtom = atom(
  null,
  (get, set, factId: number) => {
    const oldIds = get(pickAtom)?.factIds || [];
    const newIds = R.append(factId, oldIds);
    set(pickAtom, R.assoc('factIds', newIds));
  }
);

const refreshPickById = (newItem: RecentPicksItemProps, oldItems: RecentPicksItemProps[]) => {
  let found = false;
  const newItems = oldItems.reduce((acc: RecentPicksItemProps[], item) => {
    if (item.id === newItem.id) {
      found = true;
      acc.push(newItem);
    } else {
      acc.push(item);
    }
    return acc;
  }, []);

  if (!found) newItems.unshift(newItem);

  return newItems;
};

export const refreshPickAtom = atom(
  null,
  (get, set, pick: RecentPicksItemProps) => {
    const myPicks = get(myPicksAtom);
    set(myPicksAtom, refreshPickById(pick, myPicks));

    const picks = get(picksAtom);
    const masked = R.assoc('createdAt', invalidDate, pick);
    set(picksAtom, refreshPickById(masked, picks));
  }
);
export const pickSavedAtom = atom(false);

export type PicksDisplay = '' | 'header';
export const pickDisplayAtom = atom<PicksDisplay>('');

export const zoomedFactAtom = atom<any>(null);

export const timelineInterObserverAtom = atom<IntersectionObserver | null>(null);
