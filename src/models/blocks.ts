import * as R from 'ramda';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { cmsBuiltURL } from '@/lib/utils';

export async function getAllBlocks() {
  const items = await directus.request(readItems('blocks', {
    limit: -1,
  }));

  return items;
}

async function fromR2(slug: string) {
  const url = cmsBuiltURL(`blocks/${slug}.json`);

  const item = await fetch(url, {
    next: { revalidate: false }
  }).then(async (res) => {
    return await res.json();
  });

  return item as Record<string, any>;
}

export async function getBlock(slug: string, build = false) {
  if (!build && process.env.NODE_ENV !== 'development') {
    return await fromR2(slug);
  }

  const blocks = await directus.request(readItems('blocks', {
    limit: -1,
    filter: {
      slug: {
        _eq: slug,
      },
    },
  }));

  return blocks[0];
}
