import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { cmsBuiltURL } from '@/lib/utils';
import { ACTS } from './store';
import type { LawItem } from './store';

async function fromR2() {
  const url = cmsBuiltURL('laws.json');

  const { byAct, tagList } = await fetch(
    url,
    {
      cache: 'force-cache',
      next: { revalidate: false }
    }
  ).then(async (res) => {
    const result = await res.json();
    return result as {
      byAct: Record<string, LawItem[]>,
      tagList: string[],
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
      sort: ['act', 'article'],
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

  Object.keys(byAct).forEach(act => {
    byAct[act].sort((a, b) => {
      return Number.parseFloat(a.article.replaceAll('-', '.')) - Number.parseFloat(b.article.replaceAll('-', '.'));
    });
  });

  tagList.add(''); // ensure '無' tag present

  const bySortedAct = ACTS.reduce((acc: Record<string, LawItem[]>, act) => {
    acc[act] = byAct[act];
    return acc;
  }, {});

  return {
    byAct: bySortedAct,
    tagList: Array.from(tagList)
  };
}
