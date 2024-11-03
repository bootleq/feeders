import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

const envPath = path.resolve('.env.production');
const envConfig = dotenv.config({ path: envPath });

if (envConfig.error) {
  console.error('Failed to load .env.production file:', envConfig.error);
  process.exit(1);
}

const buildKey = fs.readFileSync('directus/build/BUILD_KEY', 'utf8');

const envJson = JSON.stringify({
  NEXT_PUBLIC_CMS_BUILD_KEY: buildKey,
  ...envConfig.parsed
});

try {
  execSync(`echo '${envJson}' | wrangler pages secret bulk --project feeders`, { stdio: 'inherit' });
  console.log("\nDone");
} catch (error) {
  console.error('Failed:', error);
}
