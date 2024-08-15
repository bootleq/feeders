import * as R from 'ramda';
import { eq, and, desc, sql, count, getTableName } from 'drizzle-orm';

import {
  users,
  areas,
  changes,
  spotFollowups,
} from '@/lib/schema';
import { SpotActionEnum } from '@/lib/schema';
import type { LatLngBounds } from '@/lib/schema';

import { db } from '@/lib/db';

export const runtime = 'edge';

export const RENAME_COOL_OFF_DAYS = 30;

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

const renameHistoryQuery = (userId: string, limit: number) => {
  const query = db
    .select({
      docId: changes.docId,
      items: sql<string>`json_object('content', json(content), 'time', createdAt * 1000)`.as('items')
    })
    .from(changes)
    .where(
      and(
        eq(changes.docType, getTableName(users)),
        eq(changes.docId, userId),
        eq(changes.scope, 'name'),
      )
    ).orderBy(desc(changes.createdAt))
    .limit(limit)
    .as('rename_history');

  return query;
};

export type RenameHistoryEntry = {
  content: string,
  time: number,
} | null;

export const getQuickProfileQuery = (userId: string) => {
  const recentRenames = renameHistoryQuery(userId, 3);

  const query = db.select({
    id:        users.id,
    name:      users.name,
    state:     users.state,
    createdAt: users.createdAt,
    lockedAt:  users.lockedAt,
    renames: sql<RenameHistoryEntry>`json_group_array(${recentRenames.items})`.mapWith(deepParseJSON).as('renames'),
  }).from(users)
  .leftJoin(recentRenames, eq(recentRenames.docId, users.id))
  .where(eq(users.id, userId));

  return query;
};

const deepParseJSON = (v: any) => {
  try {
    const parsed = JSON.parse(v);

    const deepParse = (obj: any) => {
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          if (typeof obj[key] === 'string') {
            try {
              const nested = JSON.parse(obj[key]);
              obj[key] = deepParse(nested);
            } catch (e) {
              // keep string if can't parse
            }
          } else if (typeof obj[key] === 'object') {
            obj[key] = deepParse(obj[key]);
          }
        }
      }
      return obj;
    };

    return deepParse(parsed);
  } catch (e) {
    return v;
  }
};

export const getProfile = async (userId: string) => {
  const actionCounts = db.select({
    action: spotFollowups.action,
    count: count().as('count'),
  }).from(spotFollowups)
    .groupBy(spotFollowups.action)
    .where(eq(spotFollowups.userId, userId))
    .as('action_counts')

  const renameHistory = renameHistoryQuery(userId, 240);

  const u = await db.select({
    id:        users.id,
    name:      users.name,
    state:     users.state,
    createdAt: users.createdAt,
    lockedAt:  users.lockedAt,
    actionCounts: sql<string>`json_group_array(json_object('action', ${actionCounts.action}, 'count', ${actionCounts.count}))`.as('action_counts'),
    renames: sql<RenameHistoryEntry>`json_group_array(${renameHistory.items})`.mapWith(deepParseJSON).as('renames'),
  }).from(users)
  .leftJoin(actionCounts, sql`1=1`)
  .leftJoin(renameHistory, eq(renameHistory.docId, userId))
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
