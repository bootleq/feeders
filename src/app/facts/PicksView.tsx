'use client'

import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useThrottledCallback } from 'use-debounce';
import { useHydrateAtoms } from 'jotai/utils';
import { picksAtom, picksModeAtom } from '@/app/facts/store';
import { nowAtom } from '@/components/store';
import type { PickProps } from '@/models/facts';
import type { PicksMode } from '@/app/facts/store';
import PicksPanel from '@/app/facts/PicksPanel';
import Pick from '@/app/facts/Pick';
import PickList from '@/app/facts/PickList';
import MyPickList from '@/app/facts/MyPickList';
import LinkPreview from '@/components/LinkPreview';

export default function PicksView({ id, picks, mode }: {
  id: number,
  picks: PickProps[],
  mode: PicksMode,
}) {
  useHydrateAtoms([
    [picksAtom, picks],
    [picksModeAtom, mode],
  ]);
  const currentMode = useAtomValue(picksModeAtom);
  const setNow = useSetAtom(nowAtom);

  const throttledSetNow = useThrottledCallback(() => {
    setNow(new Date());
  }, 3000, { trailing: false });

  useEffect(() => {
    throttledSetNow();
  }, [throttledSetNow]);

  if (!['index', 'item', 'my'].includes(currentMode)) {
    return;
  }

  return (
    <>
      <PicksPanel mode={currentMode}>
        { currentMode === 'index' && <PickList /> }
        { currentMode === 'item'  && <Pick initialPick={picks[0]} /> }
        { currentMode === 'my'    && <MyPickList /> }
      </PicksPanel>

      <LinkPreview />
    </>
  );
}
