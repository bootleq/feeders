import os from 'os';
import fs from "fs";
import path from "path";
import { execSync, spawnSync } from "child_process";

const OUT_DIR = 'dist';
const CHARTS_REPO = expandHome(process.env.CHARTS_REPO);

function expandHome(aPath) {
  if (typeof aPath === 'string' && aPath.startsWith('~')) {
    return path.join(os.homedir(), aPath.slice(1));
  }
  return aPath;
}

function main() {
  let result;

  if (!CHARTS_REPO) {
    console.error('Variable "CHARTS_REPO" not set, aborted.');
    return;
  }

  result = spawnSync('diff', ['-qr', 'public/charts', `${CHARTS_REPO}/charts`], { encoding: 'utf8' });
  if (result.status !== 0) {
    console.error('charts has difference to its source repo, aborted.');
    console.log(result.output);
    return;
  }

  result = spawnSync('diff', ['-qr', 'public/charts', `${OUT_DIR}/charts`], { encoding: 'utf8' });
  if (result.status !== 0) {
    console.error('dist/charts has difference to public/charts, aborted.');
    console.log(result.output);
    return;
  }


  execSync('wrangler pages deploy dist', { stdio: 'inherit' });
}

main();
