import * as R from 'ramda';
import { ApiRoute } from './ApiRoute';
import type { Context } from 'hono';
import { z } from 'zod';
import {
  geohash4tw,
  latitude,
  longitude,
  GetSpotsResult,
  GetSpotsByGeohash,
} from '@/app/api/schema/api';
import { db } from '@/lib/db';
import { spots, users, PubStateEnum } from '@/lib/schema';
import { geoSpots } from '@/models/spots';

const geohash = z.string().trim().transform((val, ctx) => {
  const list = val.split(',').filter(s => s.length);
  const parsed = list.map(v => geohash4tw.safeParse(v));

  parsed.forEach((r, idx) => {
    if (!r.success) {
      r.error.issues.forEach(issue => {
        const path = [...issue.path, idx];
        ctx.addIssue({ ...issue, path });
      });
    }
  });
  return parsed.map(({ data }) => data).filter(R.isNotNil);
})

export class getSpots extends ApiRoute {
  schema = {
    request: {
      params: z.object({
        geohash: geohash.describe('Geohash').openapi({example: 'wsqq,wsqr'})
      })
    },
    responses: {
      "200": {
        description: "取得 spots，用於顯示在地圖上特定的 geohash 範圍內",
        content: {
          'application/json': {
            schema: GetSpotsByGeohash,
          },
        },
      }
    }
  }

  async handle(c: Context) {
    const data = await this.getValidatedData<typeof this.schema>()
    const items = await geoSpots(data.params.geohash);

    return c.json({
      success: true,
      items
    })
  }
}
