"use client"

import { useFormStatus } from "react-dom";
import Spinner from '@/assets/spinner.svg';

export default function SubmitBtn() {
  const { pending } = useFormStatus();

  return (
    <button className='block btn mx-auto ring-1 ring-offset-2 bg-gradient-to-br from-slate-100 to-pink-100 rounded-lg shadow-lg hover:ring-2 hover:scale-110' disabled={pending}>
      {pending ?
        <Spinner className='' width={24} height={24} aria-label='讀取中' />
        :
        '同意，以 Google 帳號登入'
      }
    </button>
  );
}

