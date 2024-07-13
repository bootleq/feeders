import { defineConfig } from 'drizzle-kit';
import { type Config } from 'drizzle-kit';

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
  const { LOCAL_DB_PATH } = process.env;

  if (LOCAL_DB_PATH) {
    Object.assign(config, {
      dbCredentials: {
        url: LOCAL_DB_PATH
      }
    });
  } else {
    throw new Error('Missing LOCAL_DB_PATH');
  }
}

export default defineConfig(config);
