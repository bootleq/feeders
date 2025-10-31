"use client"

import Linkify from 'linkify-react';
import type { Options, Opts, IntermediateRepresentation } from 'linkifyjs';
import { useSetAtom } from 'jotai';
import { useCallback, useMemo } from 'react';
import { linkPreviewUrlAtom } from '@/components/store';

const MAX_URL_LENGTH = 75;

const canPreview = (href: string) => {
  const url = new URL(href);
  const ext = url.pathname.toLowerCase().split('.').pop();
  return ext && [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'svg',
    'webp',
    'avif',
    'apng',
  ].includes(ext);
}

function TruncateText({ value }: {
  value: string
}) {
  let url = value;
  if (url.length > MAX_URL_LENGTH) {
    const chunk = Math.floor(MAX_URL_LENGTH / 5);
    const head = url.slice(0, chunk * 3);
    const tail = url.slice(-1 * chunk * 2);
    return (
      <>
        {head}
        <span className='text-purple-500'>...</span>
        {tail}
      </>
    );
  }
  return url;
}

function Anchor({ href, content, ...props }: {
  href: string,
  content: string,
  [attr: string]: any,
}) {
  const setPreviewURL = useSetAtom(linkPreviewUrlAtom);

  const onMouseOver = useCallback(() => {
    setPreviewURL(href);
  }, [href, setPreviewURL]);

  const onMouseOut = useCallback(() => {
    setPreviewURL(null);
  }, [setPreviewURL]);

  const previewEnabled = useMemo(() => {
    return canPreview(href);
  }, [href]);

  return (
    <a
      href={href}
      className={`underline underline-offset-[3px] decoration-slate-500 hover:bg-yellow-200/50 font-mono text-sm leading-6 align-bottom`}
      {...(previewEnabled ? { onMouseOver, onMouseOut } : {}) }
      {...props}
    >
      <TruncateText value={content} />
    </a>
  );
}

const validateFn = (href: string, linkType: string) => {
  if (!href.startsWith('https://') || linkType !== 'url') {
    return false;
  }

  return true;
};

const relFn = (href: string, linkType: string) => {
  return 'noopener noreferrer';
};

const renderFn = ({ attributes, content }: IntermediateRepresentation) => {
  const { href, ...props } = attributes;

  return (
    <Anchor href={href} content={content} {...props} />
  );
};

const defaultOptions: Opts = {
  target: '_blank',
  rel: relFn,
  validate: validateFn,
  render: renderFn,
  nl2br: true, // has to enable to avoid SSR bad <!-- --> marks
};

type Props = {
  value: string | null,
  className?: string,
  options?: Opts,
};

export function Desc({ value, className, ...options }: Props) {
  if (!value) {
    return null;
  }

  return (
    <Linkify as='div' options={{ ...defaultOptions, ...options }} className={`scrollbar-thin text-base whitespace-pre-wrap break-anywhere ${className}`}>
      { value }
    </Linkify>
  );
};
