import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { latitude, longitude, PubStateEnum } from '../types';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { db } from '@/lib/db';
import { spots, users } from '@/lib/schema';

export const runtime = 'edge';

const softLimit = 300;

const originExample = '24.988040038688847, 121.5210559478082';

const origin = z.string().trim().transform((val, ctx) => {
  const matches = val.match(/^(-?\d+(?:\.?\d+)?)\s*,\s*(-?\d+(?:\.?\d+)?)$/);
  if (!matches) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid format'
    });
    return z.NEVER;
  }

  const [, lat, lon] = matches;
  const parsed = [
    latitude.safeParse(lat),
    longitude.safeParse(lon)
  ];

  parsed.forEach((r, idx) => {
    const tail = idx === 0 ? 'lat' : 'lon';

    if (!r.success) {
      r.error.issues.forEach(issue => {
        const path = [...issue.path, tail];
        ctx.addIssue({ ...issue, path });
      });
    }
  });

  return parsed.map(({ data }) => data);
});

const ResultItem = z.object({
  id: z.number(),
  title: z.string(),
  desc: z.string(),
  lat: latitude,
  lon: longitude,
  state: PubStateEnum,
  created_at: z.coerce.date(),
  userId: z.string()
});

export class getSpots extends OpenAPIRoute {
  schema = {
    request: {
      params: z.object({
        origin: origin.describe('初始座標（緯度, 經度）').openapi({example: originExample})
      })
    },
    responses: {
      "200": {
        description: "取得 spots 列表",
        content: {
          'application/json': {
            schema: ResultItem.array(),
          },
        },
      }
    }
  }

  async handle(c: any) {
    const data = await this.getValidatedData<typeof this.schema>()

    const items = await db.query.spots.findMany({
      columns: {
        id: true,
        title: true,
        lat: true,
        lon: true,
        desc: true,
        state: true,
        createdAt: true,
        userId: true,
      },
      limit: softLimit + 1
    });

    return c.json({
      success: true,
      items: items
    })
  }
}
