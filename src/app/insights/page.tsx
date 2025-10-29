import * as R from 'ramda';
import type { Metadata } from "next";
import Link from 'next/link';
import { format } from '@/lib/date-fp';
import ClientDate from '@/components/ClientDate';
import { getInsights } from './getInsights';

export const metadata: Metadata = {
  title: '見解列表',
  description: '遊蕩犬餵食問題與對策',
};

const wrapperCls = [
  'container max-w-screen-xl mx-auto px-2 sm:px-0',
  'peer-[[aria-expanded="false"]]:pt-5 sm:peer-[[aria-expanded="false"]]:pt-9 2xl:peer-[[aria-expanded="false"]]:pt-0',
  'sm:peer-[[aria-expanded=true]]:ml-[40%] md:peer-[[aria-expanded=true]]:ml-[37%] lg:peer-[[aria-expanded=true]]:ml-[25%]',
].join(' ');

export default async function Page({ params }: {
  params: { path: string[] }
}) {
  const insights = await getInsights();

  return (
    <div className={wrapperCls}>
      <h1 className='text-3xl py-3'>
        見解
      </h1>

      <p className='py-1'>
        基於<Link href='/facts/' className='underline underline-offset-4 decoration-2 decoration-amber-900 hover:text-sky-900'>事實</Link>整理出看法，公開刊載，協助形成社會共識。
      </p>

      <ul className='mt-3'>
        {insights.map(item => {
          const { id, slug, title, publishedAt, modifiedAt, tags } = item;
        return (
        <li key={id} className='flex items-center text-lg'>
          <Link href={`/insights/${id}-${slug}/`} className='flex items-center hover:text-sky-900'>
            <time className='font-mono mr-3 text-base'>
              <ClientDate fallback={<span className='opacity-20'>{format({}, 'yyyy-MM-dd', publishedAt)}</span>}>
                {format({}, 'yyyy-MM-dd', publishedAt)}
              </ClientDate>
            </time>
            {title}
          </Link>

          {tags?.length &&
          <ul className='ml-2 flex flex-wrap items-center justify-end'>
            {tags.map((tag: string) => (
              <li key={tag} className='text-sm text-slate-600 p-px px-1.5 m-1 text-nowrap rounded-full ring-1 ring-slate-400'>
                {tag}
              </li>
            ))}
          </ul>
          }
        </li>
        );
        })}
      </ul>
    </div>
  );
}
