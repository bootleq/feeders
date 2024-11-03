import path from 'node:path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

const envPath = path.resolve('.env.production');
const envConfig = dotenv.config({ path: envPath });

if (envConfig.error) {
  console.error('Failed to load .env.production file:', envConfig.error);
  process.exit(1);
}

const envJson = JSON.stringify(envConfig.parsed);

try {
  execSync(`echo '${envJson}' | wrangler pages secret bulk --project feeders`, { stdio: 'inherit' });
  console.log("\nDone");
} catch (error) {
  console.error('Failed:', error);
}
