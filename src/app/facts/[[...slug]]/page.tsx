import * as R from 'ramda';
import type { Metadata, ResolvingMetadata } from "next";
import { preload } from 'react-dom';
import striptags from 'striptags';
import { notFound } from 'next/navigation';
import { getFacts } from '@/app/facts/getFacts';
import { getPickById, recentPicks, buildMasker } from '@/models/facts';
import { unstable_cache } from '@/lib/cache';
import type { PickProps } from '@/models/facts';
import { BASE_META } from '@/app/facts/utils';
import { slugAtom, ZOOM_SLUG_PATTERN } from '@/app/facts/store';
import Sidebar from '@/components/Sidebar';
import Alerts from '@/components/Alerts';
import { alertsAtom, dismissAlertAtom } from '@/components/store';
import TimelineContainer from '@/app/facts/TimelineContainer';
import ZoomArticle from '@/app/facts/ZoomArticle';
import PicksView from '@/app/facts/PicksView';
import PickFormPanel from '@/app/facts/PickFormPanel';
import SideControl from '@/app/facts/SideControl';

const pickMasker = buildMasker({ isPublic: true });

async function findZoomedFact(slug: string) {
  const zoom = slug.match(ZOOM_SLUG_PATTERN);

  if (zoom) {
    const { facts } = await getFacts();
    const factId = Number.parseInt(zoom.pop() || '', 10);
    const fact = facts.find(f => f.id === factId);
    return fact;
  }
}

const getPicks = unstable_cache(
  async () => {
    // TODO: pagination
    const pageSize = 300;
    const items = await recentPicks(pageSize);
    return items.map(pickMasker);
  },
  ['facts', 'picks'],
);

const getPicksById = unstable_cache(
  async (id: number) => {
    const items = await getPickById(id);
    return items.map(pickMasker);
  },
);

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string[] }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  let meta = { ...BASE_META };

  const slugs = (await params).slug || [];

  if (slugs[0] === 'picks') {
    if (slugs.length > 1) {
      let pick;
      const pickId = Number(slugs[1]);
      if (pickId > 0) {
        pick = (await getPicksById(pickId)).pop();
        if (pick) {
          meta.title = `${pick.title} - ${pick.userName} | 選集 - ${meta.title}`;
          meta.description = ''; // will be removed
          meta.alternates.canonical = `/facts/picks/${pick.id}/`;
        }
      }
      if (!pick) {
        notFound();
      }
    } else {
      meta.title = `選集 - ${meta.title}`;
      meta.description =  '使用者分享的事件清單（由事實時間軸中挑選），並加上個人意見';
    }
  } else if (slugs[0]?.match(ZOOM_SLUG_PATTERN)) {
    const fact = await findZoomedFact(slugs[0]);
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
    } else {
      notFound();
    }
  }

  return meta;
}

export default async function Page({ params }: {
  params: { slug: string[], }
}) {
  const { facts, tags } = await getFacts();
  const slug = params.slug?.[0] || '';
  const pickId = slug === 'picks' ? Number(params.slug?.[1]) : -1;
  const picksMode = slug === 'picks' ? (pickId > 0 ? 'item' : 'index') : '';
  const zoomedFact = await findZoomedFact(slug);

  let picks: PickProps[] = [];
  if (picksMode === 'index') {
    picks = await getPicks();
  } else if (picksMode === 'item') {
    picks = await getPicksById(pickId);
  }

  preload('/assets/GeistMonoDigits.woff2', { as: 'font' });
  preload('/assets/BootleqSpace.woff2', { as: 'font' });

  return (
    <main className="flex min-h-screen flex-row items-start justify-between">
      <PicksView id={pickId} picks={picks} mode={picksMode} />
      <PickFormPanel mode={picksMode} />

      <ZoomArticle initialFact={zoomedFact} />

      <Sidebar navTitle='事實記錄' fixed={false} className={`max-h-screen scrollbar-thin flex flex-col pb-1 z-[410] bg-gradient-to-br from-stone-50 to-slate-200`}>
        <SideControl tags={tags} facts={facts} />
      </Sidebar>

      <TimelineContainer facts={facts} initialSlug={slug} initialPick={picksMode === 'item' && picks[0] || null}  />

      <Alerts itemsAtom={alertsAtom} dismissAtom={dismissAlertAtom} />
    </main>
  );
}
