import * as R from 'ramda';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';

export const runtime = 'edge';

async function fromR2() {
  const url = `${process.env.NEXT_PUBLIC_R2_URL_PATH}/cms/insights.json`;

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

  const items = await directus.request(readItems('insights'));
  return items;
}

