"use client"

import { useId } from 'react';

const labelCls = 'flex items-center justify-end my-1 whitespace-nowrap active:font-bold';
const inputCls = [
  'ml-2 p-1 py-px',
  'rounded-md shadow-sm border-gray-300',
  'focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50',
].join(' ');

export function Input({ label, name, inputProps = {} }: {
  label: string,
  name: string,
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>,
}) {
  const id = useId();
  const { type = 'text', className, name: _name, ...restProps } = inputProps;

  return (
    <>
      <label htmlFor={id} className={labelCls}>{label}</label>
      <input id={id} type={type} className={`${inputCls} ${className}`} {...restProps} />
    </>
  );
}

export function Textarea({ label, name, children, inputProps = {} }: {
  label: string,
  name: string,
  children?: React.ReactNode,
  inputProps?: React.InputHTMLAttributes<HTMLTextAreaElement>,
}) {
  const id = useId();
  const { className, name: _name, ...restProps } = inputProps;

  return (
    <>
      <label htmlFor={id} className={labelCls}>{label}</label>
      <textarea id={id} className={`${inputCls} ${className}`} {...restProps}>
        {children}
      </textarea>
    </>
  );
}

