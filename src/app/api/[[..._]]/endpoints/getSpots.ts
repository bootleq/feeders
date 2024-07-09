import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { latitude, longitude, PubStateEnum } from '../types';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

const originExample = '23.9739, 120.9773';

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
  desc: z.string(),
  lat: latitude,
  lon: longitude,
  state: PubStateEnum,
  created_at: z.coerce.date(),
  created_by: z.coerce.number(),
  user_id: z.number()
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

    const DB = getRequestContext().env.DB;

    const { results } = await DB.prepare(
      "SELECT * FROM spots WHERE state = ?"
    )
      .bind("published")
      .all();

    return c.json({
      success: true,
      items: results.map((fd: typeof ResultItem) => ResultItem.parse(fd))
    })
  }
}
