"use client"

import * as R from 'ramda';
import { useEffect, useState, useCallback } from 'react';
import { useFloating, FloatingPortal, shift, offset, autoPlacement } from '@floating-ui/react';
import { useAtomValue } from 'jotai';
import { useDebouncedCallback } from 'use-debounce';
import { present } from '@/lib/utils';
import { linkPreviewUrlAtom } from '@/components/store';
import styles from '@/components/link-preview.module.scss';
import Spinner from '@/assets/spinner.svg';

const MAX_SCREEN_USAGE = 0.6;

const wrapperCls = [
  'z-[1422] w-fit h-fit p-3 bg-slate-100/50 rounded-lg shadow-lg',
  'flex items-center justify-center',
  'border-3 border-slate-400/50 ring-2 ring-slate-300',
  'pointer-events-none animate-preview-in',
].join(' ');

const wrapperLoadingCls = [
  'z-[922] w-fit h-fit',
  'flex items-center justify-center',
].join(' ');

export default function LinkPreview() {
  const url = useAtomValue(linkPreviewUrlAtom);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [dimension, setDimension] = useState({ width: 0, height: 0 });

  const { refs, floatingStyles, update, context } = useFloating({
    open: present(url),
    strategy: 'fixed',
    middleware: [
      offset(30),
      shift({
        padding: 10,
      }),
      autoPlacement({
        padding: 10,
      }),
    ],
  });

  const onLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const availWidth = window.innerWidth;
    const availHeight = window.innerHeight;
    let width, height;

    if (naturalWidth > naturalHeight) {
      width = R.min(naturalWidth, availWidth * MAX_SCREEN_USAGE);
      height = width * naturalHeight/naturalWidth;
      if (height > availHeight * MAX_SCREEN_USAGE) {
        height = availHeight * MAX_SCREEN_USAGE;
        width = height * naturalWidth/naturalHeight;
      }
    } else {
      height = R.min(naturalHeight, availHeight * MAX_SCREEN_USAGE);
      width = height * naturalWidth/naturalHeight;
      if (width > availWidth * MAX_SCREEN_USAGE) {
        width = availWidth * MAX_SCREEN_USAGE;
        height = width * naturalHeight/naturalWidth;
      }
    }
    setDimension({ width, height });
    setLoading(false);
  }, []);

  useEffect(() => {
    setFailed(false);
    setDimension({ width: 0, height: 0 });
    setLoading(true);
  }, [url]);

  const onError = useCallback(() => {
    setFailed(true);
    setLoading(false);
  }, []);

  const debouncedMoved = useDebouncedCallback((event: MouseEvent) => {
    refs.setPositionReference({
      getBoundingClientRect() {
        return {
          x: event.clientX,
          y: event.clientY,
          width: 0,
          height: 0,
          top: event.clientY,
          left: event.clientX,
          right: event.clientX,
          bottom: event.clientY,
        };
      },
    });
    update();
  }, 50, { maxWait: 100 });

  useEffect(() => {
    if (url) window.addEventListener('mousemove', debouncedMoved);

    return () => {
      window.removeEventListener('mousemove', debouncedMoved);
    };
  }, [url, debouncedMoved]);

  if (!url) return null;

  const style = {
    ...floatingStyles,
  };

  return (
    <FloatingPortal>
      <div ref={refs.setFloating} style={style} className={loading ? wrapperLoadingCls : wrapperCls}>
        {loading &&
          <Spinner className={`scale-[2] transition-opacity opacity-0 ${styles.spinner}`} width={24} height={24} aria-label='讀取中' />
        }

        {failed &&
          <div className='bg-white-300 rounded-lg'>無法預覽</div>
        }

        { // eslint-disable-next-line
        <img
          src={url}
          alt=''
          width={dimension.width}
          height={dimension.height}
          onLoad={onLoad}
          onError={onError}
          className='h-[revert-layer]'
        />
        }
      </div>
    </FloatingPortal>
  );
}
