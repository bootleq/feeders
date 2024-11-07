import * as R from 'ramda';
import type { Metadata } from "next";
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import Link from 'next/link';
import { getInsights } from './getInsights';
import Sidebar from '@/components/Sidebar';
import Alerts from '@/components/Alerts';
import { alertsAtom, dismissAlertAtom } from '@/components/store';

export const runtime = 'edge';

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <main className="flex min-h-screen h-full flex-row items-start justify-start">
      <Sidebar navTitle='見解' fixed={false} className={`peer scrollbar-thin flex flex-col pb-1 z-[410] bg-gradient-to-br from-stone-50 to-slate-200`}>
      </Sidebar>

      {children}

      <Alerts itemsAtom={alertsAtom} dismissAtom={dismissAlertAtom} />
    </main>
  );
}
