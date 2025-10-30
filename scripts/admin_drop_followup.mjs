import { rmSync } from 'fs';
import { dirname } from 'path';
import { execSync } from 'child_process';
import { getLocalDB, makeTempSQL, revalidateCache } from '@/lib/dev';
import { PubStateEnum } from '@/lib/schema.ts';
import {
  spotFollowups,
} from '@/lib/schema';
import { eq } from 'drizzle-orm';

const args = process.argv.slice(2);

let itemId;
let state = 'dropped';
let remote = false;

if (args.length > 1) {
  itemId = args.shift().trim();
  state = args.shift().trim();
  remote = args.shift()?.trim() === '--remote';
} else {
  console.error('Failed, insufficient arguments');
  process.exit(1);
}

if (!PubStateEnum.options.includes(state)) {
  console.error(`Failed, invalid state value "${state}"`);
  process.exit(1);
}

const sql = [
  `UPDATE spotFollowups SET state = '${state}'`,
  `WHERE id = '${itemId}'`,
  'RETURNING *',
  ';',
].join(' ');

const sqlFile = makeTempSQL(sql);

const cmd = [
  'wrangler d1 execute feeders',
  `--file ${sqlFile}`,
  remote ? '--remote' : '--local',
].join(' ');

async function handleCache(id) {
  const db = getLocalDB();
  const result = await db.query.spotFollowups.findFirst({
    where: eq(spotFollowups.id, id),
    columns: { spotId: true },
  });
  const spotId = result.spotId;

  await revalidateCache(remote, {
    tags: ['spots'],
    paths: [
      `/api/followups/${spotId}/`,
      `/audit/followups/${itemId}/`,
    ]
  });
}

try {
  console.log(cmd);
  execSync(cmd, { stdio: 'inherit' });

  await handleCache(itemId);
} catch (error) {
  console.error('執行失敗：', error);
} finally {
  rmSync(dirname(sqlFile), { recursive: true, force: true });
}
