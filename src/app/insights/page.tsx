import * as R from 'ramda';
import type { Metadata } from "next";
import Link from 'next/link';
import { format } from '@/lib/date-fp';
import { getInsights } from './getInsights';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: '見解列表',
  description: '遊蕩犬餵食問題與對策',
};

export default async function Page({ params }: {
  params: { path: string[] }
}) {
  const insights = await getInsights();

  return (
    <div className='container mx-auto peer-[[aria-expanded="false"]]:pt-5 sm:peer-[[aria-expanded="false"]]:pt-0'>
      <h1 className='text-3xl py-3'>
        見解
      </h1>

      <p className='py-1'>
        基於<Link href='/facts' className='underline underline-offset-4 decoration-2 decoration-amber-900 hover:text-sky-900'>事實</Link>整理出看法，公開刊載，協助形成社會共識。
      </p>

      <ul className='mt-3'>
        {insights.map(item => {
          const { id, slug, title, publishedAt, modifiedAt, tags } = item;
        return (
        <li key={id} className='flex items-center text-lg'>
          <Link href={`/insights/${id}-${slug}`} className='flex items-center hover:text-sky-900'>
            <time className='font-mono mr-3 text-base'>{format({}, 'yyyy-MM-dd', publishedAt)}</time>
            {title}
          </Link>

          {tags?.length &&
          <ul className='ml-2 flex items-center justify-end'>
            {tags.map((tag: string) => (
              <li key={tag} className='text-sm text-slate-600 p-px px-1.5 m-1 rounded-full ring-1 ring-slate-400'>
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
