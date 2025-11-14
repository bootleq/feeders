'use client'

import { useEffect } from 'react';
import Image from 'next/image';
import siteIcon from './icon.svg'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error({ error: error, route: 'facts' })
  }, [error])

  return (
    <html lang="zh-TW" className='overscroll-none'>
      <body className=''>
        <main className="container flex flex-col min-h-screen items-center justify-center p-4 mx-auto">
          <h2 className='text-3xl'>出錯了，對不起</h2>
          <Image src={siteIcon} alt='倒置的碗' className='mt-3 origin-bottom-right rotate-[4deg]' />

          <button className='btn px-4 bg-slate-100 border border-slate-400 shadow-lg hover:bg-yellow-200'
            onClick={
              () => reset()
            }
          >
            重試
          </button>
        </main>
      </body>
    </html>
  );
}
