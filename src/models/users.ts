import * as R from 'ramda';
import { eq, and, sql } from 'drizzle-orm';

import {
  users,
  areas,
} from '@/lib/schema';
import type { LatLngBounds } from '@/lib/schema';

import { db } from '@/lib/db';

export const runtime = 'edge';

export const getWorldUsers = (userId: string) => {
  const query = db.select({
    id:       users.id,
    name:     users.name,
    state:    users.state,
    lockedAt: users.lockedAt,
    areaId:   areas.id,
    bounds:   areas.bounds,
  }).from(users)
    .leftJoin(
      areas, eq(users.id, areas.userId)
    ).limit(1);

  return query;
};

type WorldUserQuery = ReturnType<typeof getWorldUsers>;
export type WorldUserResult = Awaited<ReturnType<WorldUserQuery['execute']>>[number];

export const getProfile = async (userId: string) => {
  const u = await db.select({
    name:      users.name,
    state:     users.state,
    createdAt: users.createdAt,
    lockedAt:  users.lockedAt,
  }).from(users)
  .where(eq(users.id, userId));

  return u ? u[0] : null;
};

export const saveArea = async (userId: string, areaId: number | null, bounds: LatLngBounds) => {
  if (areaId) {
    const items = await db.update(areas).set({
      bounds: bounds
    }).where(and(
      eq(areas.id, areaId),
      eq(areas.userId, userId),
    )).returning();

    if (!items?.length) {
      throw new Error('沒有符合 id / userId 的記錄');
    }
    return items;
  }

  const items = await db.insert(areas).values({
    userId: userId,
    bounds: bounds,
  }).returning();

  return items;
};
