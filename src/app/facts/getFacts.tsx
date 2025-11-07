import * as R from 'ramda';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { cmsBuiltURL, blank } from '@/lib/utils';
import type { Fact, Tags } from '@/app/facts/store';

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
  '桃園市',
  '苗栗縣',
  '台中市',
  '彰化縣',
  '南投縣',
  '台南市',
  '高雄市',
  null,
];

export const tags = tagOrder.reduce((acc, k) => {
  acc[k || ''] = true;
  return acc;
}, {} as Tags);

async function fromR2() {
  const url = cmsBuiltURL('facts.json');

  const facts = await fetch(url, {
    next: { revalidate: false }
  }).then(async (res) => {
    return await res.json() as Fact[];
  });

  return facts;
}

export async function getFacts(build = false) {
  if (!build && process.env.NODE_ENV !== 'development') {
    return await fromR2();
  }

  const facts = await directus.request(readItems('facts', {
    limit: -1,
    sort: ['date'],
  }));

  facts.forEach(f => {
    if (blank(f.tags)) {
      f['tags'] = null;
    }
  });

  return facts as Fact[];
}
