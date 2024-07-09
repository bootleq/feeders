import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { latitude, longitude, PubStateEnum } from '../types';
import { HTTPException } from 'hono/http-exception';
import { getRequestContext } from '@cloudflare/next-on-pages';

const ResultItem = {
  id: z.number(),
  state: PubStateEnum,
  desc: z.string(),
  lat: latitude,
  lon: longitude,
  created_at: z.date()
};

export class createSpot extends OpenAPIRoute {
  schema = {
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              state: PubStateEnum.default('draft'),
              desc: z.string().default(''),
              lat: latitude,
              lon: longitude,
            })
          }
        }
      }
    },
    responses: {
      "200": {
        description: "建立新 spot",
        content: {
          'application/json': {
            schema: z.object(ResultItem)
          },
        },
      }
    }
  }

  async handle(c: any) {
    const data = await this.getValidatedData<typeof this.schema>()
    const { state, desc, lat, lon } = data.body;
    const now = new Date().toISOString();

    try {
      const DB = getRequestContext().env.DB;
      const { success } = await DB.prepare(
        `INSERT INTO spots (state, desc, lat, lon, created_at)
                VALUES (?1, ?2, ?3, ?4, ?5)`
        )
        .bind(state, desc, lat, lon, now)
        .run();

      if (success) {
        return c.json({
          success: true,
        })
      }
    } catch (e: any) {
      console.error({ message: e.message });
    }

    throw new HTTPException(500, { message: 'Database operation fail' });
  }
}
