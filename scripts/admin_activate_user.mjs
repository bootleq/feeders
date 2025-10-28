import { rmSync } from 'fs';
import { dirname } from 'path';
import { execSync } from 'child_process';
import { getLocalDB, makeTempSQL, unprepareStatement } from '@/lib/dev';
import { UserStateEnum } from '@/lib/schema.ts';
import {
  users,
  factPicks,
} from '@/lib/schema';
import { eq } from 'drizzle-orm';

const args = process.argv.slice(2);

let userId;
let state = 'inactive';
let remote = false;

if (args.length > 1) {
  userId = args.shift().trim();
  state = args.shift().trim();
  remote = args.shift()?.trim() === '--remote';
} else {
  console.error('Failed, insufficient arguments');
  process.exit(1);
}

if (!UserStateEnum.options.includes(state)) {
  console.error(`Failed, invalid state value "${state}"`);
  process.exit(1);
}

async function hintAboutCache(userId) {
  try {
    const db = getLocalDB();
    const picks = await db.select({
      id: factPicks.id,
    }).from(users)
      .leftJoin(factPicks, eq(users.id, factPicks.userId))
      .where(eq(users.id, userId));

    if (picks.length > 0) {
      console.log([
        "\nHint: should revalidate cache:",
        '/api/picks/',
        '/facts/picks/',
        ...(picks.map(({ id }) => `/facts/picks/${id}/`))
      ].join("\n"));
    }
  } catch (e) {
    console.error(`查詢 picks 失敗，未評估快取\n${e}`);
  }
}

const sql = [
  `UPDATE users SET state = '${state}'`,
  state === 'inactive' ? ', lockedAt = (unixepoch())' : '', // TODO: remove lockedAt?
  `WHERE id = '${userId}'`,
  'RETURNING *',
  ';',
].join(' ');

const sqlFile = makeTempSQL(sql);

const cmd = [
  'wrangler d1 execute feeders',
  `--file ${sqlFile}`,
  remote ? '--remote' : '--local',
].join(' ');

try {
  console.log(cmd);
  execSync(cmd, { stdio: 'inherit' });

  await hintAboutCache(userId);
} catch (error) {
  console.error('執行失敗：', error);
} finally {
  rmSync(dirname(sqlFile), { recursive: true, force: true });
}
