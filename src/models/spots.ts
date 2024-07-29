import * as R from 'ramda';
import {
  eq,
  gte,
  isNull,
  isNotNull,
  or,
  and,
  inArray,
  asc,
  desc,
  sql,
  InferSelectModel,
} from 'drizzle-orm';
import { XMLParser } from 'fast-xml-parser';

import {
  spots,
  spotFollowups,
  PubStateEnum,
} from '@/lib/schema';

import { db } from '@/lib/db';

export const runtime = 'edge';

// https://data.gov.tw/dataset/152915
const districtApiURL = 'https://api.nlsc.gov.tw/other/TownVillagePointQuery1/';
const xmlParser = new XMLParser();

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
    city:        spots.city,
    town:        spots.town,
    followupId:  spotFollowups.id,
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

export async function queryDistrict(lat: number, lon: number) {
  const url = `${districtApiURL}${lon}/${lat}`;
  const response = await fetch(url);

  if (response.ok) {
    const body = await response.text();
    const json = xmlParser.parse(body);

    return R.pipe(
      R.prop('townVillageItem'),
      R.props(['ctyName', 'townName']),
      R.map(x => typeof x === 'string' ? x : null)
    )(json);
  }

  return [null, null];
};

export const geoSpots = (geohashes: string[]) => {
  // Rank latest created followup
  const ranked = db.select({
    id:            spotFollowups.id,
    followCount:   sql<number>`COUNT(${spots.id}) OVER (PARTITION BY ${spots.id})`.as('followCount'),
    latestSpawnAt: sql<number>`MAX(${spotFollowups.spawnedAt}) OVER (PARTITION BY ${spots.id})`.as('latestSpawnAt'),
    maxFeedee:     sql<number>`MAX(${spotFollowups.feedeeCount}) OVER (PARTITION BY ${spots.id})`.as('maxFeedee'),
    rank:          sql<number>`RANK() OVER (PARTITION BY ${spots.id} ORDER BY ${spotFollowups.createdAt} DESC, ${spotFollowups.spawnedAt} DESC)`.as('rank'),
  }).from(spots)
    .innerJoin(spotFollowups, eq(spots.id, spotFollowups.spotId))
    .as('ranked')

  const query = db.select({
    id:        spots.id,
    title:     spots.title,
    lat:       spots.lat,
    lon:       spots.lon,
    city:      spots.city,
    town:      spots.town,
    geohash:   spots.geohash,
    desc:      spots.desc,
    state:     spots.state,
    createdAt: spots.createdAt,
    userId:    spots.userId,
    followerId:     spotFollowups.userId,
    action:         spotFollowups.action,
    spotState:      spotFollowups.spotState,
    material:       spotFollowups.material,
    latestFollowAt: spotFollowups.createdAt,
    followCount:    ranked.followCount,
    latestSpawnAt:  ranked.latestSpawnAt,
    maxFeedee:      ranked.maxFeedee,
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
        inArray(spots.geohash, geohashes),
      )
    )
    .orderBy(
      asc(spots.geohash),
    );

  return query;
};

export function spotsMissingDistrict(ids = []) {
  const idWhere = R.isNotEmpty(ids) ? inArray(spots.id, ids) : sql`1 = 1`;

  const query = db.select({
    id: spots.id,
    lat: spots.lat,
    lon: spots.lon,
  }).from(spots)
  .where(
    and(
      idWhere,
      isNotNull(spots.lat),
      isNotNull(spots.lon),
      or(
        isNull(spots.city),
        eq(spots.city, ''),
        isNull(spots.town),
        eq(spots.town, ''),
      ),
    )
  );

  return query;
}
