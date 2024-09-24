import * as R from 'ramda';
import { auth } from '@/lib/auth';
import directus from '@/lib/directus';
import { readItem } from '@directus/sdk';
import { getWorldUsers } from '@/models/users';
import Sidebar from '@/components/Sidebar';
import Alerts from '@/components/Alerts';
import { alertsAtom, dismissAlertAtom } from '@/components/store';
import Article from './Article';

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

async function getInsight(id: string) {
  return directus.request(readItem('insights', id, {
    fields: [
      'id',
      'title',
      'content',
      'publishedAt',
    ]
  }));
}

export default async function Page({ params }: {
  params: {
    id: string
  }
}) {
  const { id } = params;
  const session = await auth();
  const user = await getUser(session?.userId);
  const insight = await getInsight(id);
  // const tags = R.pipe(
  //   R.flatten,
  //   R.uniq,
  // )(facts.map(i => i.tags)).reduce((acc, tag) => {
  //   acc[tag || ''] = true;
  //   return acc;
  // }, {});
  const { title } = insight;

  return (
    <main className="flex min-h-screen flex-row items-start justify-start">
      <Sidebar user={user} navTitle='見解' defaultOpen={false} className={`max-h-screen scrollbar-thin flex flex-col pb-1 z-[410] bg-gradient-to-br from-stone-50 to-slate-200`}>
        TODO
      </Sidebar>

      <div className='container mx-auto ring'>
        <h1 className='text-4xl py-3 text-center'>
          {title}
        </h1>
        <Article post={insight} />
      </div>

      <Alerts itemsAtom={alertsAtom} dismissAtom={dismissAlertAtom} />
    </main>
  );
}
