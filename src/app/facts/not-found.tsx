import type { Metadata } from "next";
import { Suspense } from 'react';
import NotFoundHelper from '@/app/NotFoundHelper';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '找不到（事實頁面）',
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-row items-center justify-center">
      <div className='container mx-auto px-6 sm:px-8'>
        <h1 className='w-full flex items-center font-bold py-2 text-xl gap-x-2'>
          <code className='text-stone-400 text-4xl mr-2'>404</code>
          <span className='text-2xl'>
            這個網址找不到東西
          </span>
        </h1>

        <Suspense fallback={<div>...</div>}>
          <NotFoundHelper />
        </Suspense>

        <div className="text-lg my-2 mt-7 font-bold">
          怎麼辦？
        </div>

        <ul className="list-inside list-decimal text-md space-y-2">
          <li>
            檢查 <code className="bg-yellow-100 rounded-md px-2">/facts/<var className='text-rose-800'>***_ID</var>/</code> 中的 id 是否拼錯
          </li>
          <li>
            檢查 <code className="bg-yellow-100 rounded-md px-2">/facts/picks/<var className='text-rose-800'>***_ID</var>/</code> 中的 id 是否拼錯
          </li>
          <li className="">
            <div className="inline-flex items-center">
              <div>
                資料真的不存在，返回
                <strong>事實</strong>
                頁面：
              </div>
              <Link href="/facts/" className='font-mono underline underline-offset-4 decoration-slate-500 hover:decoration-2 hover:decoration-yellow-500'>/facts</Link>
            </div>
          </li>
        </ul>

        <hr className='w-full h-px mx-auto my-5 bg-slate-400/75 border-0' />

        <Link href="/" className='p-1 rounded-md underline underline-offset-4 decoration-slate-500 hover:decoration-2 hover:decoration-yellow-500'>返回首頁</Link>
      </div>
    </main>
  );
}
