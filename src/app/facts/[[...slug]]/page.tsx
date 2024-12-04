import * as R from 'ramda';
import type { Metadata } from "next";
import { getFacts } from '@/app/facts/getFacts';
import Sidebar from '@/components/Sidebar';
import Alerts from '@/components/Alerts';
import { alertsAtom, dismissAlertAtom } from '@/components/store';
import TimelineContainer from '@/app/facts/TimelineContainer';
import ZoomArticle from '@/app/facts/ZoomArticle';
import SideControl from '@/app/facts/SideControl';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: '事實記錄',
  description: '台灣地區與遊蕩犬、流浪狗相關的歷史事件表列',
};

export default async function Page({ params }: {
  params: {
    slug: string[],
  }
}) {
  const { facts, tags } = await getFacts();
  const slug = params.slug?.[0] || '';

  return (
    <main className="flex min-h-screen flex-row items-start justify-between">
      <Sidebar navTitle='事實記錄' fixed={false} className={`max-h-screen scrollbar-thin flex flex-col pb-1 z-[410] bg-gradient-to-br from-stone-50 to-slate-200`}>
        <SideControl tags={tags} />
      </Sidebar>

      <TimelineContainer facts={facts} slug={slug} />

      <ZoomArticle />
      <Alerts itemsAtom={alertsAtom} dismissAtom={dismissAlertAtom} />
    </main>
  );
}
