import {
  eq,
  gte,
  and,
  inArray,
  desc,
  sql,
} from 'drizzle-orm';

import {
  spots,
  spotFollowups,
  PubStateEnum,
} from '@/lib/schema';

import { db } from '@/lib/db';

export const runtime = 'edge';

export const recentFollowups = (oldestDate: Date, fetchLimit: number) => {
  // Rank latest created followup
  const ranked = db.select({
    id:          spotFollowups.id,
    followCount: sql<number>`COUNT(${spots.id}) OVER (PARTITION BY ${spots.id})`.as('followCount'),
    rank:        sql<number>`RANK() OVER (PARTITION BY ${spots.id} ORDER BY ${spotFollowups.createdAt} DESC, ${spotFollowups.spawnedAt} DESC)`.as('rank'),
  }).from(spots)
    .innerJoin(spotFollowups, eq(spots.id, spotFollowups.spotId))
    .as('ranked')

  const query = db.select({
    spotId:      spots.id,
    spotTitle:   spots.title,
    lat:         spots.lat,
    lon:         spots.lon,
    action:      spotFollowups.action,
    spotState:   spotFollowups.spotState,
    desc:        spotFollowups.desc,
    material:    spotFollowups.material,
    feedeeCount: spotFollowups.feedeeCount,
    spawnedAt:   spotFollowups.spawnedAt,
    removedAt:   spotFollowups.removedAt,
    createdAt:   spotFollowups.createdAt,
    followCount: ranked.followCount,
    userId:      spotFollowups.userId,
  }).from(spotFollowups)
    .innerJoin(
      ranked, and(
        eq(spotFollowups.id, ranked.id),
        eq(ranked.rank, 1),
      )
    )
    .innerJoin(
      spots, eq(spots.id, spotFollowups.spotId)
    )
    .where(
      and(
        inArray(spots.state, [PubStateEnum.enum.published, PubStateEnum.enum.dropped]),
        inArray(spotFollowups.state, [PubStateEnum.enum.published, PubStateEnum.enum.dropped]),
        gte(spotFollowups.createdAt, oldestDate),
      )
    )
    .orderBy(
      desc(spotFollowups.createdAt),
      desc(spotFollowups.spawnedAt),
      desc(spotFollowups.removedAt),
    )
    .limit(fetchLimit);

  return query;
};
