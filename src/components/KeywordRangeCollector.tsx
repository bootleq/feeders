import React, { useEffect, useCallback, useRef } from 'react';
import type { Atom } from 'jotai';
import type { PrimitiveAtom } from 'jotai';
import { useAtomValue, useSetAtom } from 'jotai';
import { findRanges } from '@/lib/findRanges';

interface Props {
  keywordAtom: Atom<string>;
  highlightAtom: Atom<boolean>;
  rangesAtom: PrimitiveAtom<Range[]>;
  container: HTMLElement | null;
  segmentSelector: string;
  debounceTime?: number;
}

export const KeywordRangeCollector: React.FC<Props> = ({
  keywordAtom,
  highlightAtom,
  rangesAtom,
  container,
  segmentSelector,
  debounceTime = 100,
}) => {
  const keyword = useAtomValue(keywordAtom);
  const highlight = useAtomValue(highlightAtom);
  const setRanges = useSetAtom(rangesAtom);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevKeywordRef = useRef<string>('');
  const prevSegmentsInViewRef = useRef<Element[] | null>(null);

  const getViewportRect = useCallback((): DOMRect => {
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return new DOMRect(window.scrollX, window.scrollY, vw, vh);
  }, []);

  const isElementInViewport = useCallback((el: Element, viewportRect: DOMRect): boolean => {
    if (!el.isConnected) return false;
    const rect = el.getBoundingClientRect();
    const docRect = new DOMRect(rect.left + window.scrollX, rect.top + window.scrollY, rect.width, rect.height);
    return !(
      docRect.top > viewportRect.bottom ||
      docRect.bottom < viewportRect.top ||
      docRect.left > viewportRect.right ||
      docRect.right < viewportRect.left
    );
  }, []);

  const getVisibleSegments = useCallback(() => {
    if (!container) return [];
    const viewportRect = getViewportRect();
    const allSegments = Array.from(container.querySelectorAll(segmentSelector));
    const inViewSegments: Element[] = [];

    let firstInViewIndex: number | null = null;
    for (let i = 0; i < allSegments.length; i++) {
      if (isElementInViewport(allSegments[i], viewportRect)) {
        firstInViewIndex = i;
        break;
      }
    }
    if (firstInViewIndex === null) return [];

    for (let i = firstInViewIndex; i < allSegments.length; i++) {
      if (isElementInViewport(allSegments[i], viewportRect)) {
        inViewSegments.push(allSegments[i]);
      } else {
        break;
      }
    }

    return inViewSegments;
  }, [container, segmentSelector, getViewportRect, isElementInViewport]);

  const collect = useCallback(() => {
    if (!container || !keyword || !highlight) {
      prevKeywordRef.current = '';
      return;
    }

    const segmentsInView = getVisibleSegments();
    if (
      prevKeywordRef.current === keyword &&
      prevSegmentsInViewRef.current &&
      prevSegmentsInViewRef.current.length === segmentsInView.length &&
      prevSegmentsInViewRef.current.every((el, i) => el === segmentsInView[i])
    ) {
      return;
    }

    const visibleRanges: Range[] = [];
    for (const segment of segmentsInView) {
      const ranges = findRanges(segment, keyword);
      visibleRanges.push(...ranges);
    }
    setRanges(visibleRanges);

    prevKeywordRef.current = keyword;
    prevSegmentsInViewRef.current = segmentsInView;
  }, [container, keyword, highlight, getVisibleSegments, setRanges]);

  const debouncedCollect = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      collect();
    }, debounceTime);
  }, [collect, debounceTime]);

  useEffect(() => {
    collect();

    if (!container) return;

    container.addEventListener('scroll', debouncedCollect);
    window.addEventListener('resize', debouncedCollect);

    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      container.removeEventListener('scroll', debouncedCollect);
      window.removeEventListener('resize', debouncedCollect);
      setRanges([]);
    };
  }, [keyword, container, collect, debouncedCollect, setRanges]);

  return null;
};
