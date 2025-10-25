import * as R from 'ramda';
import { ApiRoute } from './ApiRoute';
import type { Context } from 'hono';
import { z } from 'zod';
import { recentPicks, buildMasker } from '@/models/facts';

const masker = buildMasker({ isPublic: true });

// TODO: pagination
const fetchLimit = 300;

export class getFactPicks extends ApiRoute {
  async handle(c: Context) {
    const items = await recentPicks(fetchLimit);

    return c.json({
      success: true,
      items: items.map(masker),
    })
  }
}
