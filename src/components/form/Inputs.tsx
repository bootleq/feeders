"use client"

import { useId } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';
import { SpotActionEnum } from '@/lib/schema';

const labelCls = 'flex items-center justify-end my-1 whitespace-nowrap active:font-bold';
const inputCls = [
  'ml-2 p-1 py-px flex-1',
  'rounded-md shadow-sm border-gray-300',
  'focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50',
].join(' ');

const tooltipTrigger = (
  <TooltipTrigger className='flex flex-col items-center'>
    <QuestionMarkCircleIcon className='ml-1 stroke-slate-700/75 cursor-help' height={22} />
  </TooltipTrigger>
);

export function TextInput({ label, name, tooltip, type = 'text', inputProps = {} }: {
  label: string,
  name: string,
  type?: 'text' | 'number' | 'datetime-local',
  tooltip?: React.ReactNode,
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>,
}) {
  const id = useId();
  const { className = '', name: _name, type: _type, ...restProps } = inputProps;
  const tag = <input id={id} type={type} className={`${inputCls} ${className}`} {...restProps} />

  if (tooltip) {
    return (
      <>
        <label htmlFor={id} className={labelCls}>{label}</label>
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
      <label htmlFor={id} className={labelCls}>{label}</label>
      {tag}
    </>
  );
}

export function Textarea({ label, name, children, tooltip, inputProps = {} }: {
  label: string,
  name: string,
  children?: React.ReactNode,
  tooltip?: React.ReactNode,
  inputProps?: React.InputHTMLAttributes<HTMLTextAreaElement>,
}) {
  const id = useId();
  const { className = '', name: _name, ...restProps } = inputProps;

  return (
    <>
      <label htmlFor={id} className={labelCls}>{label}</label>
      <textarea id={id} className={`${inputCls} ${className}`} {...restProps}>
        {children}
      </textarea>
    </>
  );
}

export function Select({ label, name, children, tooltip, inputProps = {} }: {
  label: string,
  name: string,
  children?: React.ReactNode,
  tooltip?: React.ReactNode,
  inputProps?: React.InputHTMLAttributes<HTMLSelectElement>,
}) {
  const id = useId();
  const { className = '', name: _name, ...restProps } = inputProps;
  const tag = <select id={id} className={`${inputCls} cursor-pointer ${className}`} {...restProps}>{children}</select>

  if (tooltip) {
    return (
      <>
        <label htmlFor={id} className={labelCls}>{label}</label>
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
      <label htmlFor={id} className={labelCls}>{label}</label>
      {tag}
    </>
  );
}

