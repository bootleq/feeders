import { Feed } from 'feed';
import { APP_URL } from '@/lib/utils';
import { recentFollowups } from '@/models/spots';
import type { RecentFollowupsItemProps } from '@/models/spots';
import { PubStateEnum } from '@/lib/schema';
import { unstable_cache } from '@/lib/cache';

const FEED_SIZE = 35;
const headerCacheTime = 30 * 60;  // GET response cache: 30 minutes
const feedUrl = `${APP_URL}feeds/world.atom`;
const iconUrl = `${APP_URL}icon.svg`;

const getSpots = unstable_cache(
  async () => {
    const query = recentFollowups(FEED_SIZE);
    const items = await query;

    return items.filter(i => i.spotPubState === i.pubState && i.pubState === PubStateEnum.enum.published);
  },
  ['world', 'spots'],
  {
    tags: ['spots'],
    revalidate: 86400, // 1 day
  }
);

function buildFeed(items: RecentFollowupsItemProps[]) {
  const feed = new Feed({
    title: '世界地圖 - Feeders',
    description: '最新回報的地點或跟進',
    id: feedUrl,
    link: APP_URL!.toString(),
    language: 'zh-TW',
    favicon: iconUrl,
    feedLinks: {
      atom: feedUrl,
    },
    updated: items.length > 0 ? new Date(items[0].createdAt) : new Date(),
    generator: undefined,
  });

  for (const item of items) {
    const { spotId, spotTitle, createdAt, followCount, followupId, city, town, lat, lon, action, desc } = item;
    const title = `${city}${town}（${followCount} 跟進） ${spotTitle}`;
    const spotPath = `world/area/@${lat},${lon}#${spotId}`;
    const link = `${APP_URL}${spotPath}`;
    const date = new Date(createdAt);
    const categories = [{
      term: action,
      scheme: `${APP_URL}spots/action`,
      label: action,
    }];

    feed.addItem({
      id: `${link}__${followupId}`,
      title,
      link,
      content: desc ?? '',
      date,
      published: date,
      category: categories,
    });
  }

  return feed;
}

export async function GET() {
  const items = await getSpots();
  const feed = buildFeed(items);

  return new Response(feed.atom1(), {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': `public, s-maxage=${headerCacheTime}`,
    },
  });
}
