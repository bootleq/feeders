import { rmSync } from 'fs';
import { dirname } from 'path';
import { execSync } from 'child_process';
import { makeTempSQL, unprepareStatement, revalidateCache } from '@/lib/dev';
import { PubStateEnum } from '@/lib/schema.ts';

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
  `UPDATE spots SET state = '${state}'`,
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

try {
  console.log(cmd);
  execSync(cmd, { stdio: 'inherit' });

  await revalidateCache(remote, {
    paths: [
      `/audit/spots/${itemId}/`,
    ],
    tags: [
      'spots',
    ]
  });
} catch (error) {
  console.error('執行失敗：', error);
} finally {
  rmSync(dirname(sqlFile), { recursive: true, force: true });
}
