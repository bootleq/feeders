'use client'

import { useEffect } from 'react';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { useThrottledCallback } from 'use-debounce';
import { useHydrateAtoms } from 'jotai/utils';
import { jsonReviver } from '@/lib/utils';
import { picksAtom, picksModeAtom, loadingPicksAtom } from '@/app/facts/store';
import { nowAtom, addAlertAtom } from '@/components/store';
import type { RecentPicksItemProps } from '@/models/facts';
import type { PicksMode } from '@/app/facts/store';
import PicksPanel from '@/app/facts/PicksPanel';
import Pick from '@/app/facts/Pick';
import PickList from '@/app/facts/PickList';
import LinkPreview from '@/components/LinkPreview';

const fetchPicksAtom = atom(
  null,
  async (get, set, id?: number) => {
    try {
      const url = `/api/picks/${id && id > 0 ? id : ''}`;
      const response = await fetch(url);
      const json = await response.text();
      const fetched: {items: RecentPicksItemProps[]} = JSON.parse(json, jsonReviver);
      if (response.ok) {
        set(picksAtom, fetched.items);
      } else {
        const errorNode = <><code className='font-mono mr-1'>{response.status}</code>無法取得資料</>;
        set(addAlertAtom, 'error', errorNode);
      }
    } catch (e) {
      let errorNode;
      if (e instanceof SyntaxError) {
        errorNode = <span>非預期的回應內文</span>;
        console.log({SyntaxError: String(e)});
      } else {
        errorNode = <span>{String(e)}</span>;
      }
      set(addAlertAtom, 'error', errorNode);
    } finally {
      set(loadingPicksAtom, false);
    }
  }
);

export default function PicksView({ id, picks, mode }: {
  id: number,
  picks: RecentPicksItemProps[],
  mode: PicksMode,
}) {
  useHydrateAtoms([
    [picksAtom, picks],
    [picksModeAtom, mode],
  ]);
  const currentMode = useAtomValue(picksModeAtom);
  const setPicks = useSetAtom(picksAtom);
  const fetchPicks = useSetAtom(fetchPicksAtom);
  const setNow = useSetAtom(nowAtom);

  const throttledSetNow = useThrottledCallback(() => {
    setNow(new Date());
  }, 3000, { trailing: false });

  useEffect(() => {
    setNow(new Date());
  }, [setNow]);

  useEffect(() => {
    if (currentMode === 'index') {
      fetchPicks();
    } else if (currentMode === 'item') {
      // fetchPicks(id);  // currently we don't fetch single pick from client-side
    }
    throttledSetNow();
  }, [id, currentMode, fetchPicks, throttledSetNow]);

  if (!['index', 'item'].includes(currentMode)) {
    return;
  }

  return (
    <>
      <PicksPanel mode={currentMode}>
        {
          currentMode === 'index' ?
            <PickList />
            :
            <Pick initialPick={picks[0]} />
        }
      </PicksPanel>

      <LinkPreview />
    </>
  );
}
