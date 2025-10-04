import { rmSync } from 'fs';
import { dirname } from 'path';
import { execSync } from 'child_process';
import {
  eq,
  lte,
  and,
  gte,
  sql,
} from 'drizzle-orm';
import {
  users,
  spotFollowups,
} from '@/lib/schema';
// import { db } from '@/lib/db';
import { makeTempSQL, unprepareStatement } from '@/lib/dev';
import { subDays } from '@/lib/date-fp';
import { startOfDay } from 'date-fns';
import { tz } from "@date-fns/tz";

const TZ = tz("Asia/Taipei");
const FollowupInDays = 2; // query items within N days

const args = process.argv.slice(2);

let remote = false;

if (args.length > 0) {
  remote = args.shift()?.trim() === '--remote';
} else {
  // console.error('Failed, insufficient arguments');
  // process.exit(1);
}

const now = new Date();
const minCreatedAt = startOfDay(
  subDays(FollowupInDays, now, { in: TZ }),
  { in: TZ }
);

// const ranked = db.select({
//   id:          users.id,
//   followups: sql`COUNT(${users.id}) OVER (PARTITION BY ${users.id})`.as('followups'),
//   ids:       sql`JSON_GROUP_ARRAY(${spotFollowups.id}) OVER (PARTITION BY ${users.id})`.as('ids'),
//   rank:      sql`RANK() OVER (PARTITION BY ${users.id} ORDER BY ${spotFollowups.createdAt} DESC, ${spotFollowups.spawnedAt} DESC)`.as('rank'),
// }).from(users)
//   .innerJoin(spotFollowups, eq(users.id, spotFollowups.userId))
//   .where(gte(spotFollowups.createdAt, minCreatedAt))
//   .as('ranked');
//
// const query = db.select({
//   id: users.id,
//   name: users.name,
//   followups: ranked.followups,
//   ids: ranked.ids,
// }).from(users)
//   .innerJoin(
//     ranked, and(
//       eq(users.id, ranked.id),
//       eq(ranked.rank, 1),
//     )
//   );

// const rawSQL = unprepareStatement(query.toSQL());

const rawSQL = `select "users"."id", "users"."name", "followups", "ids" from "users" inner join (select "users"."id", COUNT("users"."id") OVER (PARTITION BY "users"."id") as "followups", JSON_GROUP_ARRAY("spotFollowups"."id") OVER (PARTITION BY "users"."id") as "ids", RANK() OVER (PARTITION BY "users"."id" ORDER BY "spotFollowups"."createdAt" DESC, "spotFollowups"."spawnedAt" DESC) as "rank" from "users" inner join "spotFollowups" on "users"."id" = "spotFollowups"."userId" where "spotFollowups"."createdAt" >= ${minCreatedAt.getTime()/1000}) "ranked" on ("users"."id" = "ranked"."id" and "rank" = 1)`;
const sqlFile = makeTempSQL(rawSQL);

const cmd = [
  'wrangler d1 execute feeders',
  `--file ${sqlFile}`,
  remote ? '--remote' : '--local',
].join(' ');

try {
  console.log(`使用者於 ${FollowupInDays} 天內新增的跟進狀況`);
  console.log(cmd);
  execSync(cmd, { stdio: 'inherit' });
} catch (error) {
  console.error('執行失敗：', error);
} finally {
  rmSync(dirname(sqlFile), { recursive: true, force: true });
}
