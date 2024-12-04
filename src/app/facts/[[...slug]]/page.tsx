import * as R from 'ramda';
import type { Metadata, ResolvingMetadata } from "next";
import { getFacts } from '@/app/facts/getFacts';
import { BASE_META } from '@/app/facts/utils';
import { slugAtom, SLUG_PATTERN } from '@/app/facts/store';
import Sidebar from '@/components/Sidebar';
import Alerts from '@/components/Alerts';
import { alertsAtom, dismissAlertAtom } from '@/components/store';
import TimelineContainer from '@/app/facts/TimelineContainer';
import ZoomArticle from '@/app/facts/ZoomArticle';
import SideControl from '@/app/facts/SideControl';

export const runtime = 'edge';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string[] }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const slug = (await params).slug?.[0] || '';
  const zoom = slug.match(SLUG_PATTERN);
  let fact = null;
  let meta = { ...BASE_META };

  if (zoom) {
    const { facts, tags } = await getFacts();
    const factId = Number.parseInt(zoom.pop() || '', 10);
    fact = facts.find(f => f.id === factId);

    if (fact) {
      meta.title = `${fact.date}: ${fact.title.trim()} - ${meta.title}`;

      const anchor = `fact-${fact.date}_${fact.id}`;
      const zoomPath = `/facts/${anchor.replace('fact-', '')}`;
      meta.alternates.canonical = zoomPath;
    }
  }

  return meta;
}

export default async function Page({ params }: {
  params: { slug: string[], }
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
