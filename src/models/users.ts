import * as R from 'ramda';
import { eq, and, sql, count, SQL } from 'drizzle-orm';

import {
  users,
  areas,
  spotFollowups,
} from '@/lib/schema';
import { SpotActionEnum } from '@/lib/schema';
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
  const actionCounts = db.select({
    action: spotFollowups.action,
    count: count().as('count'),
  }).from(spotFollowups)
    .groupBy(spotFollowups.action)
    .where(eq(spotFollowups.userId, userId))
    .as('action_counts')

  const u = await db.select({
    id:        users.id,
    name:      users.name,
    state:     users.state,
    createdAt: users.createdAt,
    lockedAt:  users.lockedAt,
    actionCounts: sql<string>`json_group_array(json_object('action', ${actionCounts.action}, 'count', ${actionCounts.count}))`.as('action_counts'),
  }).from(users)
  .leftJoin(actionCounts, sql`1=1`)
  .where(eq(users.id, userId));

  return u[0].id ? u[0] : null;
};

type ProfileQuery = ReturnType<typeof getProfile>;
export type ProfileResult = NonNullable<Awaited<ProfileQuery>> | null;

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
