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
import { db } from '@/lib/db';
import { spots, spotFollowups, PubStateEnum, SpotActionEnum } from '@/lib/schema';
import { getFollowups as dbGetFollowups } from '@/models/spots';

export const runtime = 'edge';

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
              id:        z.number(),
              userId:    z.string(),
              desc:      z.string(),
              action:    SpotActionEnum,
              spotState: PubStateEnum,
              material:  z.string(),
              createdAt: z.coerce.date(),
            }).array()
          },
        },
      }
    }
  }

  async handle(c: Context) {
    const data = await this.getValidatedData<typeof this.schema>()
    const items = await dbGetFollowups(data.params.spotId);

    return c.json({
      success: true,
      items
    })
  }
}
