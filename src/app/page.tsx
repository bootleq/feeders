import type { Metadata } from "next";
import { Noto_Serif_TC } from "next/font/google";
import Image from 'next/image';
import Link from 'next/link';
import { SITE_NAME } from '@/lib/utils';
import HomeNav from './HomeNav';
import siteIcon from './icon.svg'

const notoSerif = Noto_Serif_TC({
  weight: '400',
  subsets: ['latin'],
});

export default async function Home() {
  return (
    <main className="container flex flex-col min-h-screen items-center justify-between p-4 mx-auto">
      <h1 className='flex justify-start text-4xl py-6 relative'>
        {SITE_NAME}
      </h1>

      <p className='text-xl sm:text-2xl text-balance text-center my-2'>
        因地制宜，觀察、行動，終結流浪
      </p>

      <p className='text-2xl my-3 text-slate-600'>
        （遊蕩犬清零）
      </p>

      <HomeNav />

      <Link href='about' className='self-end mt-5 mb-12 text-slate-600 w-fit hover:text-black hover:underline decoration-yellow-300 decoration-4 underline-offset-3'>
        關於本站
      </Link>

      <div className="flex flex-col items-center mt-auto">
        <div className='text-2xl md:text-3xl text-center tracking-[16px] -mb-20 text-stone-400 animate-[pulse_6444ms_ease-in_infinite]'>
          <p className={notoSerif.className}>
            餵得嗜佛油陰
          </p>
          <p className="text-lg mt-1 md:mt-2">
            feeders.fyi
          </p>
        </div>
        <Image src={siteIcon} alt='倒置的碗' className='mt-auto' />
      </div>
    </main>
  );
}
