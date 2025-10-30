import * as R from 'ramda';
import { ApiRoute } from './ApiRoute';
import type { Context } from 'hono';
import { z } from 'zod';
import {
  eq,
  and,
  inArray,
  desc,
} from 'drizzle-orm';
import { spots, spotFollowups, PubStateEnum, SpotActionEnum } from '@/lib/schema';
import { getFollowups as dbGetFollowups } from '@/models/spots';
import { unstable_cache } from '@/lib/cache';

const getItems = unstable_cache(
  async (id: number) => {
    const items = await dbGetFollowups(id);
    return items;
  },
  ['api', 'followups'],
);

export class getFollowups extends ApiRoute {
  schema = {
    request: {
      params: z.object({
        spotId: z.coerce.number().int().nonnegative(),
      })
    },
    responses: {
      "200": {
        description: '取得 spot 之下的 followups',
        content: {
          'application/json': {
            schema: z.object({
              id:          z.number(),
              userId:      z.string(),
              desc:        z.string(),
              action:      SpotActionEnum,
              spotState:   PubStateEnum,
              material:    z.string(),
              feedeeCount: z.number(),
              createdAt:   z.coerce.date(),
              removedAt:   z.coerce.date(),
              spawnedAt:   z.coerce.date(),
              spotId:      z.number(),
              userName:    z.string(),
              changes:     z.number(),
            }).array()
          },
        },
      }
    }
  }

  async handle(c: Context) {
    const data = await this.getValidatedData<typeof this.schema>()
    const items = await getItems(data.params.spotId);

    return c.json({
      success: true,
      items
    })
  }
}
