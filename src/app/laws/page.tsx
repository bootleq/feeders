import * as R from 'ramda';
import type { Metadata } from "next";
import { present } from '@/lib/utils';
import { getLaws } from './getLaws';
import Sidebar from '@/components/Sidebar';
import Alerts from '@/components/Alerts';
import { alertsAtom, dismissAlertAtom } from '@/components/store';
import type { Tags, LawItem } from './store';
import SideControl from './SideControl';
import Acts from './Acts';

export const metadata: Metadata = {
  title: '法規',
  description: '遊蕩犬不當餵食問題的相關法規整理',
  alternates: {
    canonical: '/laws/',
  },
};

export default async function Page({ params }: {
  params: { path: string[] }
}) {
  const { byAct, tagList } = await getLaws();
  const tags = tagList.reduce((acc: Tags, tag: string) => {
    acc[tag] = true;
    return acc;
  }, {});

  return (
    <main className="flex min-h-screen flex-row items-start justify-start">
      <Sidebar navTitle='法規' fixed={false} className={`max-h-screen scrollbar-thin flex flex-col pb-1 z-[410] bg-gradient-to-br from-stone-50 to-slate-200`}>
        <SideControl tags={tags} />
      </Sidebar>

      {present(byAct) &&
        <Acts acts={byAct} />
      }

      <Alerts itemsAtom={alertsAtom} dismissAtom={dismissAlertAtom} />
    </main>
  );
}
