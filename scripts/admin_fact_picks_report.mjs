import { rmSync } from 'fs';
import { dirname } from 'path';
import { execSync } from 'child_process';
import {
  eq,
  and,
  or,
  gte,
  desc,
  sql,
  getTableName,
} from 'drizzle-orm';
import {
  users,
  factPicks,
  changes,
} from '@/lib/schema';

import { getLocalDB, makeTempSQL, unprepareStatement, selectTimeForHuman } from '@/lib/dev';
import { subDays } from '@/lib/date-fp';
import { startOfDay } from 'date-fns';
import { tz } from "@date-fns/tz";

const inDays = 3; // query items within N days
const args = process.argv.slice(2);
let remote = false;

if (args.length > 0) {
  remote = args.shift()?.trim() === '--remote';
}

const TZ = tz("Asia/Taipei");
const now = new Date();
const minCreatedAt = startOfDay(
  subDays(inDays, now, { in: TZ }),
  { in: TZ }
);
const db = getLocalDB();

function queryPicks() {
  const profiles = db.select({
    id:        users.id,
    name:      users.name,
    state:     users.state,
  }).from(users).as('profiles');

  const pickChanges = db.select({
    docId:     changes.docId,
    count:     sql`COUNT()`.as('pickChanges'),
    changedAt: sql`MAX(${changes.createdAt})`.as('changedAt'),
  }).from(changes)
    .groupBy(changes.docId)
    .where(and(
      eq(changes.docType, getTableName(factPicks)),
      eq(changes.scope, 'amendPick'),
    )).as('pickChanges');

  const query = db.select({
    id:        factPicks.id,
    title:     factPicks.title,
    factIds:   factPicks.factIds,
    state:     factPicks.state,
    userName:  profiles.name,
    createdAt: selectTimeForHuman(factPicks.createdAt, 'createdAt'),
    changes:   pickChanges.count,
    changedAt: selectTimeForHuman(pickChanges.changedAt, 'changedAt'),
  }).from(factPicks)
    .innerJoin(
      profiles, eq(profiles.id, factPicks.userId)
    )
    .leftJoin(pickChanges, eq(pickChanges.docId, factPicks.id))
    .where(
      or(
        gte(factPicks.createdAt, minCreatedAt),
        gte(pickChanges.changedAt, minCreatedAt),
      )
    )
    .orderBy(
      desc(factPicks.createdAt),
    )
    .limit(100);

  return query;
}

const rawSQL = unprepareStatement(queryPicks().toSQL());
const sqlFile = makeTempSQL(rawSQL);

const cmd = [
  'wrangler d1 execute feeders',
  `--file ${sqlFile}`,
  remote ? '--remote' : '--local',
].join(' ');

try {
  console.log(`最近 ${inDays} 天內的 factPicks 使用狀況`);
  console.log(cmd);
  execSync(cmd, { stdio: 'inherit' });
} catch (error) {
  console.error('執行失敗：', error);
} finally {
  rmSync(dirname(sqlFile), { recursive: true, force: true });
}
