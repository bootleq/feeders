"use client"

import { useEffect, useCallback, useRef } from 'react';
import { useAtomValue } from 'jotai';
import {
  allHighlighRangesAtom,
  textHighlightAtom,
} from './store';

const HIGHLIGHT_NAME = 'text-filter';

export default function Highlighter() {
  const highlightRanges = useAtomValue(allHighlighRangesAtom);
  const textHighlight = useAtomValue(textHighlightAtom);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const highlight = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      if (textHighlight) {
        CSS.highlights.set(HIGHLIGHT_NAME, new (window as any).Highlight(...highlightRanges));
      } else {
        CSS.highlights.delete(HIGHLIGHT_NAME);
      }
    }, 20);
  }, [textHighlight, highlightRanges]);

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
