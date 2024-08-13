import * as R from 'ramda';
import { auth } from '@/lib/auth';
import { getWorldUsers, getProfile } from '@/models/users';
import { notFound } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

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

export default async function Page({ params }: {
  params: { id: string }
}) {
  const session = await auth();
  const user = await getUser(session?.userId);
  const profile = await getProfile(params.id);

  if (!profile) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-row items-start justify-between">
      <Sidebar user={user} navTitle='使用者資料' fixed={false} className={`max-h-screen scrollbar-thin flex flex-col pb-1 z-[410] bg-gradient-to-br from-stone-50 to-slate-200`}>
        TODO
      </Sidebar>

      <div className='container mx-auto px-4 ring-1'>
        <h1>使用者資料</h1>
        MAIN
      </div>
    </main>
  );
}
