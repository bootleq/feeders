"use client"

import Linkify from 'linkify-react';
import type { Options, Opts, IntermediateRepresentation } from 'linkifyjs';

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
    <a
      href={href}
      className={`underline underline-offset-[3px] decoration-slate-500 hover:bg-yellow-200/50 font-mono text-sm leading-6 align-text-bottom`}
      {...props}
    >
      {content}
    </a>
  );
};

const defaultOptions: Opts = {
  target: '_blank',
  rel: relFn,
  validate: validateFn,
  render: renderFn,
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
