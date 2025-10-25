import { ApiRoute } from './ApiRoute';
import type { Context } from 'hono';
import { z } from 'zod';
import { getPickById, buildMasker } from '@/models/facts';

const masker = buildMasker({ isPublic: true });

export class getFactPickById extends ApiRoute {
  schema = {
    request: {
      params: z.object({
        id: z.coerce.number().int().positive(),
      })
    },
  }

  async handle(c: Context) {
    const data = await this.getValidatedData<typeof this.schema>()
    const items = await getPickById(data.params.id);

    return c.json({
      success: true,
      items: items.map(masker),
    })
  }
}
