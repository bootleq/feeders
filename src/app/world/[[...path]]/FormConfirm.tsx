import { TERM_DATE } from '@/app/about/term/util';
import Link from 'next/link';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

export default function Confirm() {
  return (
    <div className='p-2 m-1 rounded ring-4 ring-yellow-400 bg-gradient-to-br from-amber-200 to-yellow-300 text-center text-balance flex-col items-center'>
      <div className='flex items-center'>
        <ExclamationCircleIcon className='stroke-yellow-700 animate-pulse size-14 stroke-2 shrink-0' height={20} />
        <div className='flex flex-col items-center'>
          <div>
            資料即將公開，修改也會留下記錄，請避免洩漏私人資訊
          </div>

          <hr className='w-11/12 h-[2px] my-2 bg-slate-400/75 border-0' />

          <div className='flex items-center'>
            <div>
              同意<Link className='font-bold rounded-md w-fit hover:bg-amber-300/50' href='/about/term/' target='_blank'>使用條款</Link>
            </div>
            <span className='ml-2 font-mono text-sm text-slate-600 text-center'>{TERM_DATE}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
