import * as R from 'ramda';
import {
  eq,
  gte,
  and,
  or,
  inArray,
  desc,
  sql,
  getTableName,
} from 'drizzle-orm';

import {
  users,
  changes,
  factPicks,
  PubStateEnum,
  sqlDateMapper,
} from '@/lib/schema';

import type {
  CreateSchema as CreatePickSchema,
} from '@/app/facts/save-pick';

import { getDb } from '@/lib/db';

function profileQuery() {
  const db = getDb();
  const query = db.select({
    id:        users.id,
    name:      users.name,
    state:     users.state,
  }).from(users).as('profiles');

  return query;
}

function changesQuery() {
  const db = getDb();
  const query = db.select({
    docId:     changes.docId,
    count:     sql<number>`COUNT()`.as('followupChangesCount'),
    changedAt: sql<Date>`MAX(${changes.createdAt})`.mapWith(sqlDateMapper).as('changedAt'),
  }).from(changes)
    .groupBy(changes.docId)
    .where(and(
      eq(changes.docType, getTableName(factPicks)),
      eq(changes.scope, 'amendPick'),
    )).as('pickChanges');

  return query;
}

export const getPickById = (id: number) => {
  const db = getDb();
  const profiles = profileQuery();
  const pickChanges = changesQuery();

  const query = db.select({
    id:        factPicks.id,
    title:     factPicks.title,
    desc:      factPicks.desc,
    factIds:   factPicks.factIds,
    state:     factPicks.state,
    userId:    factPicks.userId,
    createdAt: factPicks.createdAt,
    userName:  profiles.name,
    changes:   pickChanges.count,
    changedAt: pickChanges.changedAt,
  }).from(factPicks)
    .innerJoin(profiles, eq(profiles.id, factPicks.userId))
    .leftJoin(pickChanges, eq(pickChanges.docId, factPicks.id))
    .where(
      and(
        // inArray(factPicks.state, [PubStateEnum.enum.published, PubStateEnum.enum.dropped]),
        eq(factPicks.id, id),
      )
    );

  return query;
}

export const recentPicks = (fetchLimit: number) => {
  const db = getDb();

  const oldestDate = db.selectDistinct({
    createdDateBegin: sql`unixepoch(DATETIME(${factPicks.createdAt}, 'unixepoch'), 'start of day', '-8 hours')`.as('createdDateBegin')
  }).from(factPicks)
    .orderBy(desc(factPicks.createdAt))
    .limit(1).offset(5);

  const profiles = db.select({
    id:        users.id,
    name:      users.name,
    state:     users.state,
  }).from(users).as('profiles');

  const pickChanges = db.select({
    docId:     changes.docId,
    count:     sql<number>`COUNT()`.as('followupChangesCount'),
    changedAt: sql<Date>`MAX(${changes.createdAt})`.mapWith(sqlDateMapper).as('changedAt'),
  }).from(changes)
    .groupBy(changes.docId)
    .where(and(
      eq(changes.docType, getTableName(factPicks)),
      eq(changes.scope, 'amendPick'),
    )).as('pickChanges');

  const query = db.select({
    id:        factPicks.id,
    title:     factPicks.title,
    desc:      factPicks.desc,
    factIds:   factPicks.factIds,
    state:     factPicks.state,
    userId:    factPicks.userId,
    createdAt: factPicks.createdAt,
    // createdAt: sql<Date | null>`${factPicks.createdAt}`,
    userName:  profiles.name,
    changes:   pickChanges.count,
    changedAt: pickChanges.changedAt,
    // changedAt: sql<Date | null>`${pickChanges.changedAt}`,
  }).from(factPicks)
    .innerJoin(profiles, eq(profiles.id, factPicks.userId))
    .leftJoin(pickChanges, eq(pickChanges.docId, factPicks.id))
    .where(
      and(
        // inArray(factPicks.state, [PubStateEnum.enum.published, PubStateEnum.enum.dropped]),
        or(
          gte(factPicks.createdAt, sql`IFNULL(${oldestDate}, 0)`),
          gte(pickChanges.changedAt, sql`IFNULL(${oldestDate}, 0)`),
        )
      )
    )
    .orderBy(
      desc(factPicks.createdAt),
      desc(pickChanges.changedAt),
    )
    .limit(fetchLimit);

  return query;
};

type RecentPicksQuery = ReturnType<typeof recentPicks>;
export type RecentPicksItemProps = Awaited<RecentPicksQuery>[number];

export async function createPick(data: CreatePickSchema) {
  const db = getDb();
  const pick = await db.insert(factPicks).values({
    title:   data.title,
    desc:    data.desc,
    factIds: data.factIds,
    state:   data.state,
    userId:  data.userId,
  }).returning().get();

  return pick;
}
