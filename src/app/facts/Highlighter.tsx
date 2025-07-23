"use client"

import { useEffect, useCallback, useRef } from 'react';
import { useAtomValue } from 'jotai';
import {
  allHighlighRangesAtom,
} from './store';

const HIGHLIGHT_NAME = 'text-filter';

export default function Highlighter() {
  const highlightRanges = useAtomValue(allHighlighRangesAtom);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const highlight = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      CSS.highlights.set(HIGHLIGHT_NAME, new (window as any).Highlight(...highlightRanges));
    }, 20);
  }, [highlightRanges]);

  useEffect(() => {
    if (window.CSS && 'highlights' in window.CSS) {
      highlight();
    }

    return () => {
      if (window.CSS && 'highlights' in window.CSS && CSS.highlights.has(HIGHLIGHT_NAME)) {
        CSS.highlights.delete(HIGHLIGHT_NAME);
      }
    }
  }, [highlight]);

  return null;
}
