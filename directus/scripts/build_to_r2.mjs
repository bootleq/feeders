import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getFacts } from '@/app/facts/getFacts';
import { getInsights } from '@/app/insights/getInsights';
import { getInsightById } from '@/app/insights/[id]/getInsightById';
import { getLaws } from '@/app/laws/getLaws';
import { getAllBlocks } from '@/models/blocks';

// Fetch CMS data and upload JSONs to R2.
// Put files to bucket's r2Dir (`cms`) folder.
//
// Write a build key to `build/BUILD_KEY`,
// use it for cache buster.

const STORAGE_S3_BUCKET = 'feeders';
const STORAGE_S3_REGION = 'apac';

const readSecret = (key) => {
  const srcPath = `directus/secrets/${key}.txt`;
  return fs.readFileSync(srcPath, 'utf8');
};

const s3Key = readSecret('s3_key');
const s3Secret = readSecret('s3_secret');
const s3Endpoint = readSecret('s3_endpoint');

const S3 = new S3Client({
  region: STORAGE_S3_REGION,
  endpoint: s3Endpoint,
  credentials: {
    accessKeyId: s3Key,
    secretAccessKey: s3Secret,
  },
});

const localDir = 'directus/build';
const r2Dir = 'cms';
const buildKeyPath = path.join(localDir, 'BUILD_KEY');
fs.mkdirSync(`${localDir}/${r2Dir}`, { recursive: true });

const upload = async (aFile) => {
  const file = fs.readFileSync(aFile);
  const key = aFile.slice(`${localDir}/`.length);

  const cmd = new PutObjectCommand({
    Bucket: STORAGE_S3_BUCKET,
    ContentType: 'application/json',
    CacheControl: 'public, max-age=10368000',
    Body: file,
    Key: key,
  });

  try {
    console.log(`\nUploading ${key}`);
    const response = await S3.send(cmd);
    console.log(response);
  } catch (err) {
    console.error(err);
  }
};

const saveToDisk = (data, name) => {
  const json = JSON.stringify(data);
  const key = `${r2Dir}/${name}`;
  const destPath = `${localDir}/${key}`;

  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  if (fs.existsSync(destPath)) {
    const extFile = fs.readFileSync(destPath, 'utf8');
    if (extFile === json) {
      console.log(chalk.gray(`  skip ${key} (unchanged).`));
      return;
    }
  }

  console.log(chalk.green('Write to disk', key));
  fs.writeFileSync(`${localDir}/${key}`, json);
};

const facts = await getFacts(true);
const insights = await getInsights(true);
const laws = await getLaws(true);
const blocks = await getAllBlocks();
saveToDisk(facts, 'facts.json');
saveToDisk(insights, 'insights.json');
saveToDisk(laws, 'laws.json');

fs.mkdirSync(`${localDir}/${r2Dir}/insights`, { recursive: true });
for (let idx = 0; idx < insights.length; idx++) {
  const id = insights[idx].id;
  const insight = await getInsightById(id, true);
  saveToDisk(insight, `insights/${id}.json`);
}

blocks.forEach(block => {
  const { slug } = block;
  saveToDisk(block, `blocks/${slug}.json`);
});

const buildKey = Date.now().toString();
fs.writeFileSync(buildKeyPath, buildKey);

console.log(`\nDone, BUILD_KEY:`, buildKey);

console.log("\nPlease upload files to R2, example:");
console.log([
  '  rclone sync',
  fs.realpathSync('directus/build/cms'),
  'r2:feeders/cms',
  '--metadata-set content-type=application/json',
  '--metadata-set cache-control="public, max-age=10368000"',
  '-v'
].join(' '));

process.exit();
