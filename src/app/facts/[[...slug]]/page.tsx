import * as R from 'ramda';
import type { Metadata, ResolvingMetadata } from "next";
import { preload } from 'react-dom';
import striptags from 'striptags';
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

async function findZoomedFact(slug: string) {
  const zoom = slug.match(SLUG_PATTERN);

  if (zoom) {
    const { facts } = await getFacts();
    const factId = Number.parseInt(zoom.pop() || '', 10);
    return facts.find(f => f.id === factId);
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string[] }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  let meta = { ...BASE_META };

  const slug = (await params).slug?.[0] || '';
  const fact = await findZoomedFact(slug);
  if (fact) {
    meta.title = `${fact.date}: ${fact.title.trim()} - ${meta.title}`;

    const anchor = `fact-${fact.date}_${fact.id}`;
    const zoomPath = `/facts/${anchor.replace('fact-', '')}/`;
    meta.alternates.canonical = zoomPath;

    if (fact.summary) {
      meta.description = striptags(fact.summary);
    } else {
      meta.description = ''; // will be removed
    }
  }

  return meta;
}

export default async function Page({ params }: {
  params: { slug: string[], }
}) {
  const { facts, tags } = await getFacts();
  const slug = params.slug?.[0] || '';
  const zoomedFact = await findZoomedFact(slug);

  preload('/assets/GeistMonoDigits.woff2', { as: 'font' });
  preload('/assets/BootleqSpace.woff2', { as: 'font' });

  return (
    <main className="flex min-h-screen flex-row items-start justify-between">
      <ZoomArticle initialFact={zoomedFact} />

      <Sidebar navTitle='事實記錄' fixed={false} className={`max-h-screen scrollbar-thin flex flex-col pb-1 z-[410] bg-gradient-to-br from-stone-50 to-slate-200`}>
        <SideControl tags={tags} />
      </Sidebar>

      <TimelineContainer facts={facts} initialSlug={slug} />

      <Alerts itemsAtom={alertsAtom} dismissAtom={dismissAlertAtom} />
    </main>
  );
}
