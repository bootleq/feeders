import { rmSync } from 'fs';
import { dirname } from 'path';
import { execSync } from 'child_process';
import { makeTempSQL, unprepareStatement } from '@/lib/dev';
import { UserStateEnum } from '@/lib/schema.ts';

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
} catch (error) {
  console.error('執行失敗：', error);
} finally {
  rmSync(dirname(sqlFile), { recursive: true, force: true });
}
