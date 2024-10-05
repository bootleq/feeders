import * as R from 'ramda';
import type { Metadata } from "next";
import { auth } from '@/lib/auth';
import directus from '@/lib/directus';
import { present } from '@/lib/utils';
import { readItems } from '@directus/sdk';
import { getWorldUsers } from '@/models/users';
import Sidebar from '@/components/Sidebar';
import Alerts from '@/components/Alerts';
import { alertsAtom, dismissAlertAtom } from '@/components/store';
import type { Tags, LawItem } from './store';
import SideControl from './SideControl';
import Acts from './Acts';

export const runtime = 'edge';

async function getUser(id: string | undefined) {
  if (id) {
    const users = await getWorldUsers(id);
    if (users) {
      return users[0];
    }
  }

  return null;
}

async function getLaws() {
  const byAct: Record<string, LawItem[]> = {};
  const tagList = new Set<string>();
  const items = await directus.request(readItems('laws')) as LawItem[];

  items.forEach(i => {
    const { act, tags } = i;

    if (!byAct[act]) byAct[act] = [];
    byAct[act].push(i);

    tags?.forEach((tag: string | null) => {
      const t = tag || '';
      if (!tagList.has(t)) {
        tagList.add(t);
      }
    });
  });

  tagList.add(''); // ensure 無 tag present

  return { byAct, tagList };
}

export const metadata: Metadata = {
  title: '法規',
  description: '遊蕩犬不當餵食問題的相關法規整理',
};

export default async function Page({ params }: {
  params: { path: string[] }
}) {
  const session = await auth();
  const user = await getUser(session?.userId);
  const { byAct, tagList } = await getLaws();
  const tags = Array.from(tagList).reduce((acc: Tags, tag: string) => {
    acc[tag] = true;
    return acc;
  }, {});

  return (
    <main className="flex min-h-screen flex-row items-start justify-start">
      <Sidebar user={user} navTitle='法規' fixed={false} className={`max-h-screen scrollbar-thin flex flex-col pb-1 z-[410] bg-gradient-to-br from-stone-50 to-slate-200`}>
        <SideControl tags={tags} />
      </Sidebar>

      {present(byAct) &&
        <Acts acts={byAct} />
      }

      <Alerts itemsAtom={alertsAtom} dismissAtom={dismissAlertAtom} />
    </main>
  );
}
