import type { Metadata } from "next";
import Image from 'next/image';
import Link from 'next/link';
import { SITE_NAME } from '@/lib/utils';
import Sitemap from '@/components/Sitemap';
import siteIcon from './icon.svg'

export const runtime = 'edge';

export default async function Home() {
  return (
    <main className="container flex flex-col min-h-screen items-center justify-between p-4 mx-auto">
      <h1 className='text-4xl py-6'>{SITE_NAME}</h1>

      <p className='text-xl sm:text-2xl text-balance text-center my-2'>
        因地制宜，觀察、行動，終結流浪
      </p>

      <p className='text-2xl my-3 text-slate-600'>
        （遊蕩犬清零）
      </p>

      <Sitemap className='mt-16 md:mt-auto' />

      <Link href='about' className='self-end mt-5 text-slate-600 w-fit hover:text-black hover:underline decoration-yellow-300 decoration-4 underline-offset-3'>
        關於本站
      </Link>

      <Image src={siteIcon} alt='倒置的碗' className='mt-auto' />
    </main>
  );
}
