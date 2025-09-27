import * as R from 'ramda';
import directus from '@/lib/directus';
import { readItem, readFiles } from '@directus/sdk';
import { cmsBuiltURL } from '@/lib/utils';

export type File = {
  [key: string]: any,
};

type Result = {
  insight: Record<string, any>,
  files: File[],
};

async function fromR2(id: number) {
  const url = cmsBuiltURL(`insights/${id}.json`);

  const item = await fetch(url, {
    next: { revalidate: false }
  }).then(async (res) => {
    return await res.json();
  });

  return item as Result;
}

export async function getInsightById(id: number, build = false) {
  if (!build && process.env.NODE_ENV !== 'development') {
    return await fromR2(id);
  }

  const insight = await directus.request(
    readItem('insights', id, {
      fields: [
        'id',
        'title',
        'slug',
        'content',
        'publishedAt',
        'modifiedAt',
        'editors',
        'tags',
        'cms_file_ids',
        {
          'facts.facts_id': [
            'id',
            'title',
            'date'
          ],
        },
      ],
    })
  );

  let files: File[] = [];

  try {
    files = await directus.request(readFiles({
      filter: {
        folder: { name: { _eq: 'public' } },
        id: {
          _in: JSON.parse(insight.cms_file_ids)
        }
      },
    }));
  } catch (e) {
    console.log("Failed reading files", e);
  }

  const facts = R.map(R.prop('facts_id'), insight.facts || []);

  return {
    insight: { ...insight, facts },
    files,
  } as Result;
}
