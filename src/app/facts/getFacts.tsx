import * as R from 'ramda';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { cmsBuiltURL } from '@/lib/utils';
import type { Tags } from '@/app/facts/store';

export const runtime = 'edge';

const tagOrder = [
  '餵食',
  '源頭管理',
  '收容',
  'TNR',
  '安樂死',
  '捕犬',
  '統計',
  '立法',
  '施政',
  '教育',
  '監察院',
  '報導',
  '社運',
  '動團',
  '民間狗場',
  '相信動物',
  '人犬衝突',
  '犬獸衝突',
  '人身',
  '犬殺',
  '狂犬病',
  '虐待',
  '毒殺',
  '狗肉',
  '台北市',
  '新北市',
  '苗栗縣',
  '台中市',
  '南投縣',
  '台南市',
  '高雄市',
  null,
];


async function fromR2() {
  const url = cmsBuiltURL('facts.json');

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

const tagOrderIndex = R.pipe(
  R.flip(R.indexOf)(tagOrder),
  R.defaultTo(Infinity)
);

export async function getFacts(build = false) {
  if (!build && process.env.NODE_ENV !== 'development') {
    return await fromR2();
  }

  const facts = await directus.request(readItems('facts', {
    limit: -1,
    sort: ['date'],
  }));

  const tags = R.pipe(
    R.flatten,
    R.uniq,
    R.sortBy(tagOrderIndex),
  )(facts.map(i => i.tags)).reduce<Record<string, boolean>>((acc, tag) => {
    const key = (tag as string | null) || '';
    acc[key] = true;
    return acc;
  }, {});

  return { facts, tags };
}
