import React, { useEffect, useCallback, useRef } from 'react';
import { findRanges } from '@/lib/findRanges';

interface KeywordHighlighterProps {
  keyword: string;
  container: HTMLElement | null;
  segmentSelector: string;
  highlightName?: string;
  debounceTime?: number;
}

export const KeywordHighlighter: React.FC<KeywordHighlighterProps> = ({
  keyword,
  container,
  segmentSelector,
  highlightName = 'text-filter',
  debounceTime = 400,
}) => {
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

  const applyHighlights = useCallback(() => {
    if (!container || !keyword || !window.CSS || !('highlights' in window.CSS)) {
      if (CSS.highlights.has(highlightName)) {
        CSS.highlights.delete(highlightName);
      }
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

    if (CSS.highlights.has(highlightName)) {
      CSS.highlights.delete(highlightName);
    }

    if (visibleRanges.length > 0 && typeof (window as any).Highlight === 'function') {
      CSS.highlights.set(highlightName, new (window as any).Highlight(...visibleRanges));
    }

    prevKeywordRef.current = keyword;
    prevSegmentsInViewRef.current = segmentsInView;
  }, [container, keyword, highlightName, getVisibleSegments]);

  const debouncedApplyHighlights = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      applyHighlights();
    }, debounceTime);
  }, [applyHighlights, debounceTime]);

  useEffect(() => {
    applyHighlights();

    if (!container) return;

    container.addEventListener('scroll', debouncedApplyHighlights);
    window.addEventListener('resize', debouncedApplyHighlights);

    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      container.removeEventListener('scroll', debouncedApplyHighlights);
      window.removeEventListener('resize', debouncedApplyHighlights);

      if (CSS.highlights.has(highlightName)) {
        CSS.highlights.delete(highlightName);
      }
    };
  }, [keyword, container, applyHighlights, debouncedApplyHighlights, highlightName]);

  return null;
};
