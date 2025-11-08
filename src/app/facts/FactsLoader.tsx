"use client"

import { useEffect } from 'react';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { present } from '@/lib/utils';
import { getFacts} from '@/app/facts/getFacts';
import {
  factsAtom,
  factsLoadedAtom,
  mergeFactsAtom,
} from './store';
import { addAlertAtom } from '@/components/store';

function triggerHashChange(hash: string) {
  const href = window.location.href;
  const hashChangeEvent = new HashChangeEvent('hashchange', {
    oldURL: href,
    newURL: href,
    bubbles: true,
  });
  setTimeout(() => {
    window.dispatchEvent(hashChangeEvent);
  }, 700);
}

const fetchFactsAtom = atom(
  null,
  async (get, set) => {
    try {
      const facts = await getFacts();
      if (present(facts)) {
        set(mergeFactsAtom, facts);
        set(factsLoadedAtom, true);

        const hash = window.location.hash;
        if (hash.startsWith('#fact-')) {
          triggerHashChange(hash);
        }
      } else {
        const errorNode = <>無法取得資料</>;
        set(addAlertAtom, 'error', errorNode);
      }
    } catch (e) {
      const errorNode = <>讀取資料失敗</>;
      set(addAlertAtom, 'error', errorNode);
      console.error(`Fail loading facts: ${JSON.stringify(e, null, 2)}`);
      console.log({catch: 'fetchFactsAtom', error: e});
    } finally {
    }
  }
);

export default function FactsLoader() {
  const fetchFacts = useSetAtom(fetchFactsAtom);
  const loaded = useAtomValue(factsLoadedAtom);

  useEffect(() => {
    if (!loaded) {
      fetchFacts();
    }
  }, [loaded, fetchFacts]);

  return null;
}
