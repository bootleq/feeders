import fs from 'node:fs';
import path from 'node:path';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getFacts } from '@/app/facts/getFacts';
import { getInsights } from '@/app/insights/getInsights';
import { getInsightById } from '@/app/insights/[id]/getInsightById';
import { getLaws } from '@/app/laws/getLaws';

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
fs.rmSync(localDir, { recursive: true, force: true });
fs.mkdirSync(`${localDir}/${r2Dir}`, { recursive: true });

const collectFiles = (dir, acc) => {
  fs.readdirSync(dir).forEach(name => {
    const fullpath = path.join(dir, name);
    const stat = fs.statSync(fullpath);
    if (stat.isFile()) {
      acc.push(fullpath);
    } else if (stat.isDirectory()) {
      collectFiles(fullpath, acc);
    }
  })
};

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
  console.log('Write to disk', key);
  fs.writeFileSync(`${localDir}/${key}`, json);
};

const facts = await getFacts(true);
const insights = await getInsights(true);
const laws = await getLaws(true);
saveToDisk(facts, 'facts.json');
saveToDisk(insights, 'insights.json');
saveToDisk(laws, 'laws.json');

fs.mkdirSync(`${localDir}/${r2Dir}/insights`, { recursive: true });
for (let idx = 0; idx < insights.length; idx++) {
  const id = insights[idx].id;
  const insight = await getInsightById(id, true);
  saveToDisk(insight, `insights/${id}.json`);
}

const localFiles = [];
collectFiles(`${localDir}/${r2Dir}`, localFiles);

for (let idx = 0; idx < localFiles.length; idx++) {
  await upload(localFiles[idx]);
}

const buildKey = Date.now().toString();
fs.writeFileSync(buildKeyPath, buildKey);
console.log(`Done, BUILD_KEY:`, buildKey);

process.exit();
