import fs from 'node:fs';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getFacts } from '@/app/facts/getFacts';
import { getInsights } from '@/app/insights/getInsights';
import { getLaws } from '@/app/laws/getLaws';

// Fetch CMS data and upload JSON to R2.
// Put files to bucket's r2Dir (`cms`) folder.

const STORAGE_S3_BUCKET = 'feeders';
const STORAGE_S3_REGION = 'apac';

const readSecret = (key) => {
  const srcPath = `directus/secrets/${key}.txt`;
  return fs.readFileSync(srcPath, 'utf8');
};

const s3Key = readSecret('s3_key');
const s3Secret = readSecret('s3_secret');
const s3Endpoint = readSecret('s3_endpoint');

const r2Dir = 'cms';

const S3 = new S3Client({
  region: STORAGE_S3_REGION,
  endpoint: s3Endpoint,
  credentials: {
    accessKeyId: s3Key,
    secretAccessKey: s3Secret,
  },
});

const localDir = 'directus/build';
fs.rmSync(localDir, { recursive: true, force: true });
fs.mkdirSync(`${localDir}/${r2Dir}`, { recursive: true });

// Async upload function
const upload = async (aJSON, aKey) => {
  const cmd = new PutObjectCommand({
    Bucket: STORAGE_S3_BUCKET,
    ContentType: 'application/json',
    Body: aJSON,
    Key: aKey,
  });

  try {
    console.log(`\nUploading ${aKey}`);
    const response = await S3.send(cmd);
    console.log(response);
  } catch (err) {
    console.error(err);
  }
};

const saveAndUpload = async (data, name) => {
  const json = JSON.stringify(data);
  const key = `${r2Dir}/${name}`;
  console.log('Write to local', key);
  fs.writeFileSync(`${localDir}/${key}`, json);
  await upload(json, key);
};

const facts = await getFacts(true);
const insights = await getInsights(true);
const laws = await getLaws(true);
await saveAndUpload(facts, 'facts.json');
await saveAndUpload(insights, 'insights.json');
await saveAndUpload(laws, 'laws.json');

console.log('Done');

process.exit();
