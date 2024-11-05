import { tmpdir } from 'os';
import { mkdtempSync, writeFileSync, unlinkSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
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

function makeTemp(text) {
  const dir = mkdtempSync(join(tmpdir(), 'sql-'));
  const file = join(dir, 'query.sql');
  writeFileSync(file, text);
  return file;
}

const sql = [
  `UPDATE spotFollowups SET state = '${state}'`,
  `WHERE id = '${itemId}'`,
  'RETURNING *',
  ';',
].join(' ');

const sqlFile = makeTemp(sql);

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
