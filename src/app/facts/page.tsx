import * as R from 'ramda';
import { auth } from '@/lib/auth';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { getWorldUsers } from '@/models/users';
import Sidebar from '@/components/Sidebar';
import type { Tags } from './store';
import Timeline from './Timeline';
import SideControl from './SideControl';

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

async function getFacts() {
  return directus.request(readItems('Facts'));
}

export default async function Page({ params }: {
  params: { path: string[] }
}) {
  const session = await auth();
  const user = await getUser(session?.userId);
  const facts = await getFacts();
  const tags = R.pipe(
    R.flatten,
    R.uniq,
  )(facts.map(i => i.tags)).reduce((acc, tag) => {
    acc[tag || ''] = true;
    return acc;
  }, {});

  return (
    <main className="flex min-h-screen flex-row items-start justify-between">
      <Sidebar user={user} navTitle='事實記錄' fixed={false} className={`max-h-screen scrollbar-thin flex flex-col pb-1 z-[410] bg-gradient-to-br from-stone-50 to-slate-200`}>
        <SideControl tags={tags} />
      </Sidebar>

      <div className='w-full mx-auto px-0 grid sm:grid-cols-2 gap-2'>
        <Timeline facts={facts} />
      </div>
    </main>
  );
}
