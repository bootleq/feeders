import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import {
  latitude,
  longitude,
  CreateSpotResult
} from '@/app/api/schema/api';
import { HTTPException } from 'hono/http-exception';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { db } from '@/lib/db';
import { spots, PubStateEnum } from '@/lib/schema';
import { auth } from '@/lib/auth';

export class createSpot extends OpenAPIRoute {
  schema = {
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              title: z.string().default('').openapi({ example: '隨機滷味' }),
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
        description: "建立新 spot，需要登入",
        content: {
          'application/json': {
            schema: CreateSpotResult
          },
        },
      }
    }
  }

  async handle(c: any) {
    const data = await this.getValidatedData<typeof this.schema>()
    const { title, state, desc, lat, lon } = data.body;
    const now = new Date();

    const session = await auth();

    if (!session?.userId || session?.user?.state !== 'active') {
      throw new HTTPException(401);
    }

    try {
      const item = await db.insert(spots)
        .values({
          title,
          state,
          desc,
          lat,
          lon,
          userId: session.userId,
          createdAt: now
        }).returning();

      if (item) {
        return c.json({
          success: true,
          item: item
        })
      }
    } catch (e: any) {
      console.error({ message: e.message });
    }

    throw new HTTPException(500, { message: 'Database operation fail' });
  }
}
