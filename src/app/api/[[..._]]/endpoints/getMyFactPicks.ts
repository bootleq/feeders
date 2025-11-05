import * as R from 'ramda';
import { auth } from '@/lib/auth';
import { ApiRoute } from './ApiRoute';
import type { Context } from 'hono';
import { z } from 'zod';
import { recentPicks } from '@/models/facts';
import { UserStateEnum } from '@/lib/schema';

// TODO: pagination
const fetchLimit = 300;

export class getMyFactPicks extends ApiRoute {
  async handle(c: Context) {
    const session = await auth();

    if (!session) {
      return c.json({
        success: false,
        error: 'Unauthorized',
      }, 401);
    }

    const { user } = session;

    if (user.state !== UserStateEnum.enum.active || !user.id) {
      return c.json({
        success: false,
        error: 'Forbidden',
      }, 403);
    }

    const items = await recentPicks(fetchLimit, user.id);

    return c.json({
      success: true,
      items
    });
  }
}

