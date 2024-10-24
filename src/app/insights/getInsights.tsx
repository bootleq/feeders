import * as R from 'ramda';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { cmsBuiltURL } from '@/lib/utils';

export const runtime = 'edge';

async function fromR2() {
  const url = cmsBuiltURL('insights.json');

  const items = await fetch(url, {
    next: { revalidate: false }
  }).then(async (res) => {
    return await res.json();
  });

  return items as Record<string, any>[];
}

export async function getInsights(build = false) {
  if (!build && process.env.NODE_ENV !== 'development') {
    return await fromR2();
  }

  const items = await directus.request(
    readItems('insights', {
      limit: -1,
      fields: [
        'id',
        'title',
        'slug',
        'content',
        'publishedAt',
        'modifiedAt',
        'tags',
      ],
    })
  );
  return items;
}
