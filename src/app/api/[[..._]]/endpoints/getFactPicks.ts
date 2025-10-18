import * as R from 'ramda';
import { ApiRoute } from './ApiRoute';
import type { Context } from 'hono';
import { z } from 'zod';
import { recentPicks } from '@/models/facts';

// TODO: pagination
const fetchLimit = 300;

export class getFactPicks extends ApiRoute {
  async handle(c: Context) {
    const items = await recentPicks(fetchLimit);

    return c.json({
      success: true,
      items
    })
  }
}
