import os from 'os';
import fs from 'node:fs';
import path from "path";
import { spawnSync } from "child_process";

const CHARTS_REPO = expandHome(process.env.CHARTS_REPO);
const BUILD_INFO = `${CHARTS_REPO}/BUILD`;

function expandHome(aPath) {
  if (typeof aPath === 'string' && aPath.startsWith('~')) {
    return path.join(os.homedir(), aPath.slice(1));
  }
  return aPath;
}

function checkUpdate() {
  const result = spawnSync('diff', ['-qr', 'public/charts', `${CHARTS_REPO}/charts`], { encoding: 'utf8' });
  if (result.status === 0) {
    console.log('public/charts is up to date.');
    return false;
  }
  return true;
}

function main() {
  if (!CHARTS_REPO) {
    console.error('Variable "CHARTS_REPO" not set, aborted.');
    return;
  }

  if (!checkUpdate()) {
    console.log('Skipped.');
    return;
  }

  const info = fs.readFileSync(BUILD_INFO, 'utf8');

  console.log("Fetching assets, latest BUILD info:\n");
  console.log(info);
  console.log();

  const result = spawnSync(
    'rsync',
    ['-az', '--info=stats2', '--delete', `${CHARTS_REPO}/charts`, 'public/'],
    { encoding: 'utf8',  stdio: 'inherit' }
  );
  if (result.status !== 0) {
    console.error('Failed sync assets back.');
    console.error(result.error);
    return;
  }

  console.log("\nDone.");
}

main();
