"use client"

import { useFormStatus } from "react-dom";
import Spinner from '@/assets/spinner.svg';

function DefaultSpinner({ className }: {
  className?: string
}) {
  return (
    <Spinner className={className} width={24} height={24} aria-label='讀取中' />
  );
}

// NOTE: only clean <form> action submission should use this component
export default function SubmitButton({ className, spinner, spinnerClassName, children, ...rest }: {
  className?: string,
  spinner?: React.ReactNode,
  spinnerClassName?: string,
  children?: React.ReactNode,
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  const spinnerUI = spinner || <DefaultSpinner className={spinnerClassName} />;

  return (
    <button className={`btn ${className}`} disabled={pending} {...rest}>
      {pending ?
        spinnerUI
        :
        children
      }
    </button>
  );
}
