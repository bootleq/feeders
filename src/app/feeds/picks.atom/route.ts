import * as R from 'ramda';
import { Feed } from 'feed';
import { APP_URL } from '@/lib/utils';
import { recentPicks, buildMasker } from '@/models/facts';
import type { RecentPicksItemProps } from '@/models/facts';
import { PubStateEnum } from '@/lib/schema';
import { unstable_cache } from '@/lib/cache';

const masker = buildMasker({ isPublic: true });

const FEED_SIZE = 35;
const headerCacheTime = 30 * 60;  // GET response cache: 30 minutes
const feedUrl = `${APP_URL}feeds/fact-picks.atom`;
const iconUrl = `${APP_URL}icon.svg`;

const getPicks = unstable_cache(
  async () => {
    const query = recentPicks(FEED_SIZE);
    const items = await query;
    return items.filter(i => {
      return i.state === PubStateEnum.enum.published && i.publishedAt;
    }).map(masker);
  },
  ['feeds', 'picks'],
  {
    tags: ['picks'],
    revalidate: 86400, // 1 day
  }
);

function buildFeed(items: RecentPicksItemProps[]) {
  const feed = new Feed({
    title: '事實選集 - Feeders',
    description: '事實頁面的公開選集',
    id: feedUrl,
    link: APP_URL!.toString(),
    language: 'zh-TW',
    favicon: iconUrl,
    feedLinks: {
      atom: feedUrl,
    },
    updated: items.length > 0 ? new Date(items[0].publishedAt!) : new Date(),
    generator: undefined,
  });

  for (const item of items) {
    const { id, title, desc, publishedAt } = item;
    const link = `${APP_URL}facts/picks/${id}`;
    const date = publishedAt!;

    feed.addItem({
      id: link,
      title: title ?? '',
      link,
      content: desc ?? '',
      date,
      published: date,
    });
  }

  return feed;
}

export async function GET() {
  const items = await getPicks();
  const feed = buildFeed(items as RecentPicksItemProps[]);

  return new Response(feed.atom1(), {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': `public, s-maxage=${headerCacheTime}`,
    },
  });
}
