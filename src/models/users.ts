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
    ).where(eq(users.id, userId))
    .limit(1);

  return query;
};

type WorldUserQuery = ReturnType<typeof getWorldUsers>;
export type WorldUserResult = Awaited<ReturnType<WorldUserQuery['execute']>>[number];

type ProfileActionCounts = {
  coop: number,
  downvote: number,
  investig: number,
  power: number,
  remove: number,
  see: number,
  talk: number
} | null;

type ProfileRenames = {
  content: string,
  time: number,
}[] | null;

const renameHistoryQuery = (limit: number) => {
  const query = db.$with('rename_history').as(
    db.select({
      docId: changes.docId,
      items: sql<string>`json_group_array(json_object('content', json(content), 'time', createdAt * 1000) ORDER BY createdAt DESC)`.as('items')
    }).from(changes)
    .where(and(
      eq(changes.docType, getTableName(users)),
      eq(changes.scope, 'name'),
    )).groupBy(changes.docId)
    .limit(limit)
  );

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

const expandActionCounts = (v: { action: string, count: number }[]) => {
  const result = v.reduce<Record<string, number>>(
    (acc, { action, count }) => {
      acc[action] = count;
      return acc;
    }, {});
  return result;
};

export const getQuickProfileQuery = () => {
  const recentRenames = renameHistoryQuery(3);
  const query = db.with(recentRenames).select({
    id:        users.id,
    name:      users.name,
    state:     users.state,
    createdAt: users.createdAt,
    lockedAt:  users.lockedAt,
    renames: sql<ProfileRenames>`${recentRenames.items}`.mapWith(deepParseJSON as (v: any) => ProfileRenames).as('renames'),
  }).from(users)
  .leftJoin(recentRenames, eq(recentRenames.docId, users.id))

  return query;
};

export const getProfile = async (userId: string) => {
  const actionCounts = db.$with('actionCounts').as(
    db.select({
      items: sql<string>`json_group_array(json_object('action', action, 'count', count))`.as('ac_items')
    }).from(
      db.select({
        action: spotFollowups.action,
        count: count().as('count'),
      }).from(spotFollowups)
      .groupBy(spotFollowups.action)
      .where(eq(spotFollowups.userId, userId)).as('actionCountsSub')
    )
  );
  const renameHistory = renameHistoryQuery(240);

  const query = db.with(actionCounts, renameHistory).select({
    id:        users.id,
    name:      users.name,
    state:     users.state,
    desc:      users.desc,
    createdAt: users.createdAt,
    lockedAt:  users.lockedAt,
    actionCounts: sql<ProfileActionCounts>`${actionCounts.items}`.mapWith(R.pipe(deepParseJSON, expandActionCounts)).as('actionCounts'),
    renames: sql<ProfileRenames>`${renameHistory.items}`.mapWith(deepParseJSON as (v: any) => ProfileRenames).as('renames'),
  }).from(users)
    .leftJoin(actionCounts, eq(users.id, userId))
    .leftJoin(renameHistory, eq(users.id, renameHistory.docId))
    .where(eq(users.id, userId));

  const result = await query;
  return result ? result[0] : null;
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
