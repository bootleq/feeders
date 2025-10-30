import * as R from 'ramda';
import { rmSync } from 'fs';
import { dirname } from 'path';
import { execSync } from 'child_process';
import { getLocalDB, makeTempSQL, revalidateCache } from '@/lib/dev';
import { UserStateEnum } from '@/lib/schema.ts';
import {
  users,
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

async function handleCache(userId) {
  const db = getLocalDB();
  const result = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true },
    with: {
      picks: {
        columns: { id: true, },
      },
      spots: {
        columns: { id: true, },
      },
      followups: {
        columns: { spotId: true, },
      },
    },
  });

  const ids = {
    picks: result?.picks.map(R.prop('id')) || [],
    spots: result?.spots.map(R.prop('id')) || [],
    followupSpots: result?.followups.map(R.prop('spotId')) || [],
  };
  const { picks, spots, followupSpots } = ids;
  const paths = [], tags = [];

  if (spots.length > 0 || followupSpots.length > 0) {
    tags.push('spots');
  }
  if (followupSpots.length > 0) {
    paths.push(
      ...(followupSpots.map(({ spotId }) => `/api/followups/${spotId}/`)),
    );
  }
  if (picks.length > 0) {
    paths.push(...[
      '/api/picks/',
      '/facts/picks/',
      ...(picks.map(id => `/facts/picks/${id}/`)),
      ...(picks.map(id => `/audit/pick/${id}/`)),
    ]);
  }

  if (paths.length > 0 || tags.length > 0) {
    await revalidateCache(remote, { paths, tags });
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

  await handleCache(userId);
} catch (error) {
  console.error('執行失敗：', error);
} finally {
  rmSync(dirname(sqlFile), { recursive: true, force: true });
}
