import type { Metadata } from "next";
import Image from 'next/image';
import { SITE_NAME } from '@/lib/utils';
import Sitemap from '@/components/Sitemap';
import siteIcon from './icon.svg'

export const runtime = 'edge';

export const metadata: Metadata = {
  title: `首頁 - ${SITE_NAME}`
};

export default async function Home() {
  return (
    <main className="container flex flex-col min-h-screen items-center p-4 mx-auto">
      <h1 className='text-4xl py-6'>{SITE_NAME}</h1>

      <p className='text-2xl text-balance text-center'>
        因地制宜，觀察動手，終結流浪
      </p>

      <Sitemap className='mt-auto' />

      <Image src={siteIcon} alt='倒置的碗' className='mt-auto' />
    </main>
  );
}
