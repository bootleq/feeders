import { ApiRoute } from './ApiRoute';
import type { Context } from 'hono';
import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';

export class deleteCache extends ApiRoute {
  schema = {
    security: [{ apiKey: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              paths: z.array(z.string()).optional().openapi({ example: ['/facts', '/audit/spot'] }),
              tags: z.array(z.string()).optional().openapi({ example: ['picks', 'users'] }),
            }).refine(
              (data) => data.paths || data.tags,
              { message: '缺少 paths 或 tags 參數' }
            )
          }
        }
      }
    },
  }

  async handle(c: Context) {
    const data = await this.getValidatedData<typeof this.schema>()
    const { paths, tags } = data.body;
    const report = {
      api: 'deleteCache',
      paths: [] as string[],
      tags: [] as string[],
    };

    paths && paths.forEach(i => {
      report.paths.push(i)
      revalidatePath(i);
    });

    tags && tags.forEach(i => {
      report.tags.push(i)
      revalidateTag(i);
    });

    console.log(report);

    return c.json({
      success: true,
    })
  }
}
