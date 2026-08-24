import confirm from '@inquirer/confirm';
import { spawnSync } from 'child_process';

// 一次性設定 rclone remote（互動式 OAuth，需要自己的 Google 帳號授權）：
//   rclone config create gdrive-md drive scope=drive root_folder_id=<目標資料夾 id>
// 建好後把 remote 名稱設進 RCLONE_REMOTE_GDRIVE（見 .env.development）。
// root_folder_id 讓這個 remote 只認得目標資料夾，不會動到 Drive 其他地方。

const srcDir = 'directus/build/ai';

// 白名單：只同步這幾個子目錄，build/ai 底下其他檔案（如 facts_index_manifest.json）
// 或未來新增的東西一律不動。
const includeDirs = ['facts', 'laws'];

const rcloneRemote = process.env.RCLONE_REMOTE_GDRIVE;

if (!rcloneRemote) {
  console.error('Variable "RCLONE_REMOTE_GDRIVE" is not set, aborted.');
  process.exit(1);
}

// 用 `rclone sync` 做完整鏡像：白名單目錄裡本機沒有的檔案，遠端也會被刪除；
// 白名單外的東西不在比對範圍內，不會被同步或刪除。
// 手動跑（有 TTY）時先讓人確認一次；排程／cron 跑（沒有 TTY）就直接執行。
const rclone = async () => {
  const cmd = 'rclone';
  const cmdArgs = [
    'sync',
    srcDir,
    `${rcloneRemote}:`,
    ...includeDirs.flatMap((dir) => ['--filter', `+ /${dir}/**`]),
    '--filter', '- *',
    '--fast-list',
    '-v',
  ];

  if (process.stdin.isTTY) {
    console.log(`\n完整鏡像同步 "${srcDir}" 底下的 ${includeDirs.join('/')} 到 Google Drive（白名單目錄裡遠端多出的檔案會被刪除）？`);
    const yes = await confirm({
      message: `${cmd} ${cmdArgs.join(' ')}`,
      default: false,
    });
    if (!yes) {
      console.log('Aborted.');
      return;
    }
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
};

await rclone();
