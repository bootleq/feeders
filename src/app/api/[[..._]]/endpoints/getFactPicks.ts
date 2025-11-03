import * as R from 'ramda';
import { ApiRoute } from './ApiRoute';
import type { Context } from 'hono';
import { z } from 'zod';
import { recentPicks, buildMasker } from '@/models/facts';
import { unstable_cache } from '@/lib/cache';

const masker = buildMasker({ isPublic: true });

// TODO: pagination
const fetchLimit = 300;

const getItems = unstable_cache(
  async () => {
    console.log({ '💀 cache thru': 'API getItems' });

    const items = await recentPicks(fetchLimit);
    return items;
  },
  ['api', 'picks'],
  {
    tags: ['picks', 'users'],
  }
);

export class getFactPicks extends ApiRoute {
  async handle(c: Context) {
    const items = await getItems();

    return c.json(
      {
        success: true,
        items: items.map(masker),
      },
      200,
      {
        'Cache-Control': 'public, max-age=60',
      }
    );
  }
}
