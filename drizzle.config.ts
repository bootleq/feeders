import { defineConfig } from 'drizzle-kit';
import { type Config } from 'drizzle-kit';
import { readdirSync } from 'node:fs';

const { REMOTE_D1 } = process.env;

const config: Config = {
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  migrations: {
    prefix: 'timestamp'
  }
}

if (REMOTE_D1) {
  Object.assign({
    driver: 'd1-http',
    dbCredentials: {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      databaseId: process.env.CLOUDFLARE_DATABASE_ID,
      token: process.env.CLOUDFLARE_D1_TOKEN
    },
    strict: true,
  }, config);
} else {
  const localDbDir = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject';
  const files = readdirSync(localDbDir);
  const file = files.find(file => file.endsWith('.sqlite'));
  const localDbPath = file ? `${localDbDir}/${file}` : null;

  if (localDbPath) {
    Object.assign(config, {
      dbCredentials: {
        url: localDbPath
      }
    });
  } else {
    throw new Error(`Aborted. Missing local DB, expect sqlite file in: ${localDbDir}.`);
  }
}

export default defineConfig(config);
