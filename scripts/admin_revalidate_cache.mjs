const API_URL = process.env.API_URL;
const API_KEY = process.env.ADMIN_API_SECRET;

async function clearCache({ paths = [], tags = [] }) {
  if (!API_KEY) {
    console.error('ADMIN_API_SECRET not found');
    process.exit(1);
  }

  if (paths.length === 0 && tags.length === 0) {
    console.error('Please provide at least one path or tag');
    process.exit(1);
  }

  try {
    const body = {};
    if (paths.length > 0) body.paths = paths;
    if (tags.length > 0) body.tags = tags;

    console.log('Clearing cache...');

    const response = await fetch(`${API_URL}/cache/`, {
      method: 'DELETE',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed:', data.error || response.statusText);
      process.exit(1);
    }

    console.log("Success:\n", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:\n", error.message);
    process.exit(1);
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const paths = [];
  const tags = [];
  let currentFlag = null;

  for (const arg of args) {
    if (arg === '--paths' || arg === '-p') {
      currentFlag = 'paths';
    } else if (arg === '--tags' || arg === '-t') {
      currentFlag = 'tags';
    } else if (currentFlag === 'paths') {
      paths.push(arg);
    } else if (currentFlag === 'tags') {
      tags.push(arg);
    }
  }

  return { paths, tags };
}

const { paths, tags } = parseArgs();
clearCache({ paths, tags });
