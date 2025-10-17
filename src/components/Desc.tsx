"use client"

import Linkify from 'linkify-react';
import type { Options, Opts, IntermediateRepresentation } from 'linkifyjs';
import { useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { linkPreviewUrlAtom } from '@/components/store';

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

function Anchor({ href, content, ...props }: {
  href: string,
  content: string,
  [attr: string]: any,
}) {
  const setPreviewURL = useSetAtom(linkPreviewUrlAtom);

  const onMouseOver = useCallback(() => {
    if (canPreview(href)) {
      setPreviewURL(href);
    }
  }, [href, setPreviewURL]);

  const onMouseOut = useCallback(() => {
    setPreviewURL(null);
  }, [setPreviewURL]);

  return (
    <a
      href={href}
      className={`underline underline-offset-[3px] decoration-slate-500 hover:bg-yellow-200/50 font-mono text-sm leading-6 align-text-bottom`}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      {...props}
    >
      {content}
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
