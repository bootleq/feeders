"use client"

import * as R from 'ramda';
import { useId, useMemo } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';
import { SpotActionEnum } from '@/lib/schema';
import { t } from '@/lib/i18n';
import { atom, useAtomValue } from 'jotai';
import { errorsAtom, metaAtom } from '@/components/form/store';

export const labelCls = [
  'inline-flex justify-end my-1 whitespace-nowrap active:font-bold',
  'aria-[invalid]:text-red-700 aria-[invalid]:font-bold aria-[invalid]:ring-red-200 aria-[invalid]:ring-opacity-80',
].join(' ');
export const inputCls = [
  'ml-2 p-1 py-px flex-1',
  'rounded-md shadow-sm border-gray-300',
  'focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50',
  'read-only:bg-gray-100',
  '[&[type="number"]]:font-mono',
  '[&[type="date"]]:font-mono',
  '[&:user-invalid]:border-red-300 [&:user-invalid]:ring [&:user-invalid]:ring-red-200 [&:user-invalid]:ring-opacity-80',
].join(' ');

export const tooltipTrigger = (
  <TooltipTrigger className='flex flex-col items-center'>
    <QuestionMarkCircleIcon className='ml-1 stroke-slate-700/75 cursor-help' height={22} />
  </TooltipTrigger>
);

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  invalid?: boolean;
}

export interface LabelOptions {
  align?: 'start' | 'center';
}

export function useFieldError(field: string) {
  const fieldErrorAtom = useMemo(() => atom(get => get(errorsAtom)[field]), [field]);
  const errors = useAtomValue(fieldErrorAtom);
  return errors;
}

export function useFieldNameTranslate(field: string) {
  const meta = useAtomValue(metaAtom);
  const nameScope = meta['fieldNameScope'];
  const translate = useMemo(() => R.partial(t, [nameScope]), [nameScope]);
  return translate;
}

export function TextInput({ label, name, tooltip, type = 'text', inputProps = {} }: {
  label?: string,
  name: string,
  type?: 'text' | 'number' | 'date' | 'datetime-local',
  tooltip?: React.ReactNode,
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>,
}) {
  const id = useId();
  const errors = useFieldError(name);
  const fieldName = useFieldNameTranslate(name);

  const invalid = errors?.length > 0;
  const { className = '', name: _name, type: _type, ...restProps } = inputProps;
  const tag = <input id={id} name={name} type={type} className={`${inputCls} ${className}`} {...restProps} />

  const labelProps: LabelProps = {
    htmlFor: id,
    className: labelCls,
    children: label || fieldName(name),
    ...(invalid ? { 'aria-invalid': true } : {})
  };

  if (tooltip) {
    return (
      <>
        <label {...labelProps} />
        <div className='flex items-center'>
          {tag}
          <Tooltip>
            {tooltipTrigger}
            <TooltipContent className="z-[1002] max-w-[80vw]">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </div>
      </>
    );
  }

  return (
    <>
      <label {...labelProps} />
      {tag}
    </>
  );
}

export function Textarea({ label, name, children, tooltip, labelOpts = {}, inputProps = {} }: {
  label?: string,
  name: string,
  children?: React.ReactNode,
  tooltip?: React.ReactNode,
  labelOpts?: LabelOptions,
  inputProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
}) {
  const id = useId();
  const { className = '', name: _name, ...restProps } = inputProps;
  const { align: labelAlign = 'center' } = labelOpts;
  const errors = useFieldError(name);
  const fieldName = useFieldNameTranslate(name);

  const invalid = errors?.length > 0;
  const mergedLabelProps: LabelProps = {
    htmlFor: id,
    className: `${labelCls} ${labelAlign === 'center' ? 'items-center' : 'items-start'}`,
    children: label || fieldName(name),
    ...(invalid ? { 'aria-invalid': true } : {})
  };

  return (
    <>
      <label {...mergedLabelProps} />
      <textarea id={id} name={name} className={`${inputCls} text-base ${className}`} {...restProps}>
        {children}
      </textarea>
    </>
  );
}

export function Select({ label, name, children, tooltip, inputProps = {} }: {
  label?: string,
  name: string,
  children?: React.ReactNode,
  tooltip?: React.ReactNode,
  inputProps?: React.InputHTMLAttributes<HTMLSelectElement>,
}) {
  const id = useId();
  const { className = '', name: _name, ...restProps } = inputProps;
  const tag = <select id={id} name={name} className={`${inputCls} cursor-pointer ${className}`} {...restProps}>{children}</select>
  const errors = useFieldError(name);
  const fieldName = useFieldNameTranslate(name);

  const invalid = errors?.length > 0;
  const labelProps: LabelProps = {
    htmlFor: id,
    className: labelCls,
    children: label || fieldName(name),
    ...(invalid ? { 'aria-invalid': true } : {})
  };

  if (tooltip) {
    return (
      <>
        <label {...labelProps} />
        <div className='flex items-center'>
          {tag}
          <Tooltip>
            {tooltipTrigger}
            <TooltipContent className="z-[1002] max-w-[80vw]">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </div>
      </>
    );
  }

  return (
    <>
      <label {...labelProps} />
      {tag}
    </>
  );
}

