import * as R from 'ramda';
import type { Metadata } from "next";
import { getFacts } from './getFacts';
import Sidebar from '@/components/Sidebar';
import Alerts from '@/components/Alerts';
import { alertsAtom, dismissAlertAtom } from '@/components/store';
import TimelineContainer from './TimelineContainer';
import ZoomArticle from './ZoomArticle';
import SideControl from './SideControl';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: '事實記錄',
  description: '台灣地區與遊蕩犬、流浪狗相關的歷史事件表列',
};

export default async function Page({ params }: {
  params: { path: string[] }
}) {
  const { facts, tags } = await getFacts();

  return (
    <main className="flex min-h-screen flex-row items-start justify-between">
      <Sidebar navTitle='事實記錄' fixed={false} className={`max-h-screen scrollbar-thin flex flex-col pb-1 z-[410] bg-gradient-to-br from-stone-50 to-slate-200`}>
        <SideControl tags={tags} />
      </Sidebar>

      <TimelineContainer facts={facts} />

      <ZoomArticle />
      <Alerts itemsAtom={alertsAtom} dismissAtom={dismissAlertAtom} />
    </main>
  );
}
