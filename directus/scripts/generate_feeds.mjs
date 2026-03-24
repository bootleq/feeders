import { Feed } from 'feed'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { APP_URL } from '@/lib/utils';
import { directus } from '@/lib/directus';
import { readItems } from '@directus/sdk';

async function getFacts() {
  const facts = await directus.request(readItems('facts', {
    limit: 25,
    sort: ['-date_updated'],
  }));

  return facts;
}

function buildFeed(facts) {
  const feedUrl = `${APP_URL}feeds/facts.atom`;
  const iconUrl = `${APP_URL}icon.svg`;

  const feed = new Feed({
    title: '事實記錄 - Feeders',
    description: '最近更新的「事實記錄」條目',
    id: feedUrl,
    link: APP_URL.toString(),
    language: 'zh-TW',
    favicon: iconUrl,
    feedLinks: {
      atom: feedUrl,
    },
    updated: facts.length > 0 ? new Date(facts[0].date_updated) : new Date(),
    generator: null,
  });

  for (const fact of facts) {
    const anchor = `fact-${fact.date}_${fact.id}`;
    const zoomPath = `facts/${anchor.replace('fact-', '')}/`;
    const link = `${APP_URL}${zoomPath}`;
    const categories = fact.tags.map(tag => ({
      term: tag,
      scheme: `${APP_URL}facts/tags`,
      label: tag,
    }));

    feed.addItem({
      id: link,
      title: `${fact.date}: ${fact.title}`,
      link,
      content: fact.desc ?? '',
      date: new Date(fact.date_updated),
      published: new Date(fact.date_created),
      category: categories,
    });
  }

  return feed;
}

async function main() {
  const facts = await getFacts();
  const feed = buildFeed(facts);

  const outDir = join('public', 'feeds');
  mkdirSync(outDir, { recursive: true });

  const outPath = join(outDir, 'facts.atom')
  writeFileSync(outPath, feed.atom1(), 'utf-8');

  console.log(`Feed generated to: ${outPath}`);
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
});
