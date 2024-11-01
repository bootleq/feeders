import * as R from 'ramda';
import type { Metadata } from "next";
import { auth } from '@/lib/auth';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import Link from 'next/link';
import { format } from '@/lib/date-fp';
import { getWorldUsers } from '@/models/users';
import { getInsights } from './getInsights';
import Sidebar from '@/components/Sidebar';
import Alerts from '@/components/Alerts';
import { alertsAtom, dismissAlertAtom } from '@/components/store';

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

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth();
  const user = await getUser(session?.userId);

  return (
    <main className="flex min-h-screen h-full flex-row items-start justify-start">
      <Sidebar user={user} navTitle='見解' fixed={false} defaultOpen={true} className={`peer scrollbar-thin flex flex-col pb-1 z-[410] bg-gradient-to-br from-stone-50 to-slate-200`}>
      </Sidebar>

      {children}

      <Alerts itemsAtom={alertsAtom} dismissAtom={dismissAlertAtom} />
    </main>
  );
}
