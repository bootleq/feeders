import * as R from 'ramda';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import type { Tags } from '@/app/facts/store';

export const runtime = 'edge';

async function fromR2() {
  const url = `${process.env.NEXT_PUBLIC_R2_URL_PATH}/cms/facts.json`;

  const { facts, tags } = await fetch(url, {
    next: { revalidate: false }
  }).then(async (res) => {
    const result = await res.json();
    return result as {
      facts: Record<string, any>[],
      tags: Tags,
    };
  });

  return { facts, tags };
}

export async function getFacts(build = false) {
  if (!build && process.env.NODE_ENV !== 'development') {
    return await fromR2();
  }

  const facts = await directus.request(readItems('Facts'));

  const tags = R.pipe(
    R.flatten,
    R.uniq,
  )(facts.map(i => i.tags)).reduce((acc, tag) => {
    acc[tag || ''] = true;
    return acc;
  }, {});

  return { facts, tags };
}
