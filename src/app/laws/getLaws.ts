import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import type { LawItem } from './store';

export const runtime = 'edge';

async function fromR2() {
  const url = `${process.env.NEXT_PUBLIC_R2_URL_PATH}/cms/laws.json`;

  const { byAct, tagList } = await fetch(
    url,
    {
      // cache: 'force-cache',  // can't, next-on-pages lack of support
      next: { revalidate: false }
    }
  ).then(async (res) => {
    const result = await res.json();
    return result as {
      byAct: Record<string, LawItem[]>,
      tagList: Set<string>,
    }
  });

  return { byAct, tagList };
}

export async function getLaws(build = false) {
  if (!build && process.env.NODE_ENV !== 'development') {
    return await fromR2();
  }

  const byAct: Record<string, LawItem[]> = {};
  const tagList = new Set<string>();
  const items = await directus.request(
    readItems('laws', {
      limit: -1,
      filter: {
        status: {
          _eq: 'published',
        },
      },
    })
  ) as LawItem[];

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

  tagList.add(''); // ensure '無' tag present

  return { byAct, tagList };
}
