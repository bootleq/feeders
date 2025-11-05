import { join } from 'path';
import { tmpdir } from 'os';
import { readdirSync, mkdtempSync, writeFileSync } from 'fs';
import confirm from '@inquirer/confirm';
import { spawnSync } from 'child_process';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import * as schema from '@/lib/schema';

export function makeTempSQL(text: string) {
  const dir = mkdtempSync(join(tmpdir(), 'sql-'));
  const file = join(dir, 'query.sql');
  writeFileSync(file, text);
  return file;
}

export function unprepareStatement(querySQL: any) {
  const { sql, params } = querySQL;
  if (!params.length) {
    return sql;
  }

  if (params.length !== sql.match(/\?/g)?.length) {
    throw new Error("Unmatched parameter size for the SQL query.");
  }

  let index = 0;

  return sql.replace(/\?/g, () => {
    const param = params[index++];
    if (param === null) {
      return "NULL";
    }
    if (typeof param === "string") {
      return `'${param.replace(/'/g, "''")}'`;
    }
    if (typeof param === "number" || typeof param === "boolean") {
      return param.toString();
    }
    if (typeof param === "object" && param instanceof Date) {
      return param.getTime() / 1000;
    }
    throw new Error(`Unsupported parameter type: ${typeof param}`);
  });
}

export function selectTimeForHuman(col: any, alias: string) {
  const offset = 8 * 60 * 60; // UTC+8
  return sql`strftime('%Y %m/%d %H:%M', ${col} + ${offset}, 'unixepoch')`.as(alias);
}

export const getLocalDB = () => {
  const dbDir = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject';
  const files = readdirSync(dbDir);
  const basename = files.find(f => f.endsWith('.sqlite'));

  if (!basename) {
    throw new Error(`Can find sqlite db in dir:\n  ${dbDir}`);
  }
  const file = join(dbDir, basename);
  const sqlite = new Database(file, { fileMustExist: true });
  return drizzle(sqlite, { schema });
};

export async function revalidateCache(remote: boolean, { paths, tags }: {
  paths?: string[],
  tags?: string[],
}) {
  const envFile = remote ? '.env.production' : '.env.development';
  const args: string[] = [`--env-file=${envFile}`, 'scripts/admin_revalidate_cache.mjs'];

  if (paths && paths.length > 0) {
    args.push('--paths', ...paths);
  }
  if (tags && tags.length > 0) {
    args.push('--tags', ...tags);
  }

  const yes = await confirm({
    message: 'Revalidate cache now?',
    default: false,
  });
  if (!yes) {
    console.log('Cache to be revalidated:');
    console.log(JSON.stringify({paths, tags}, null, 2));
    return;
  }

  const result = spawnSync(
    'pnpm',
    ['tsx', ...args],
    { stdio: 'inherit' }
  );

  if (result.error) {
    console.error(`Failed to execute admin_revalidate_cache script: ${result.error.message}`);
  }
  if (result.status !== 0) {
    console.error(`Failed with exit code ${result.status}`);
  }
}
