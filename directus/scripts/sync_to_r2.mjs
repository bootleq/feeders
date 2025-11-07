import confirm from '@inquirer/confirm';
import { spawnSync } from 'child_process';

const STORAGE_S3_BUCKET = 'feeders';

const rcloneRemote = process.env.RCLONE_REMOTE;
const srcDir = 'directus/build/cms';
const r2Dir = 'cms';

if (!rcloneRemote) {
  console.error('Variable "RCLONE_REMOTE" is not set, aborted.');
  process.exit(1);
}

const rclone = async () => {
  console.log(`\nUpload built "cms/" resources to R2?`);

  const cmd = 'rclone';
  const cmdArgs = [
    'sync',
    srcDir,
    `${rcloneRemote}:${STORAGE_S3_BUCKET}/${r2Dir}`,
    // '--dry-run',
    '--fast-list',
    '--metadata-set="content-type=application/json"',
    `--metadata-set='cache-control="public, max-age=10368000"'`,
    // NOTE: final cache-control is set by domain's Caching Rules eventually
    '-v'
  ];

  const yes = await confirm({
    message: `${cmd} ${cmdArgs.join(' ')}`,
    default: false,
  });
  if (!yes) {
    console.log('Aborted.');
    return;
  }

  const result = spawnSync(cmd, cmdArgs, { stdio: 'inherit' });
  if (result.error) {
    console.error(`Failed to start rclone: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`rclone failed with exit code ${result.status}`);
    process.exit(1);
  }
}

await rclone();
