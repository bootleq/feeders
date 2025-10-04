import type { Metadata } from "next";
import { Suspense } from 'react';
import NotFoundHelper from './NotFoundHelper';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '找不到',
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-row items-center justify-center">
      <div className='container mx-auto px-6 sm:px-8'>
        <h1 className='w-full flex items-center font-bold py-2 text-xl gap-x-2'>
          <code className='text-stone-400 text-4xl mr-2'>404</code>
          <span className=''>
            這個網址找不到東西
          </span>
        </h1>

        <Suspense fallback={<div>...</div>}>
          <NotFoundHelper />
        </Suspense>

        <hr className='w-full h-px mx-auto my-5 bg-slate-400/75 border-0' />

        <Link href="/" className='p-1 rounded-md underline underline-offset-4 decoration-slate-500 hover:decoration-2 hover:decoration-yellow-500'>返回首頁</Link>
      </div>
    </main>
  );
}
