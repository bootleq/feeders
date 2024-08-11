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
  users,
  areas,
  spots,
  spotFollowups,
  PubStateEnum,
  SpotStateEnum,
  sqlDateMapper,
} from '@/lib/schema';

import type { Schema as CreateSpotSchema } from '@/app/world/[[...path]]/create-spot';
import type { Schema as CreateFollowupSchema } from '@/app/world/[[...path]]/create-followup';

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
    geohash:     spots.geohash,
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

type RecentFollowupsQuery = ReturnType<typeof recentFollowups>;
export type RecentFollowupsItemProps = Awaited<RecentFollowupsQuery>[number];
export type RecentFollowupsResult = Awaited<ReturnType<RecentFollowupsQuery['execute']>>;

export const getWorldUsers = (userId: string) => {
  const query = db.select({
    id:       users.id,
    name:     users.name,
    state:    users.state,
    lockedAt: users.lockedAt,
    areaId:   areas.id,
    bounds:   areas.bounds,
  }).from(users)
    .leftJoin(
      areas, eq(users.id, areas.userId)
    ).limit(1);

  return query;
};

type WorldUserQuery = ReturnType<typeof getWorldUsers>;
export type WorldUserResult = Awaited<ReturnType<WorldUserQuery['execute']>>[number];

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
    id:              spotFollowups.id,
    followCount:     sql<number>`COUNT(${spots.id}) OVER (PARTITION BY ${spots.id})`.as('followCount'),
    followerCount:   sql<number>`COUNT(${spotFollowups.spawnedAt}) OVER (PARTITION BY ${spots.id})`.as('followerCount'),
    respawnCount:    sql<number>`COUNT(${spotFollowups.spawnedAt}) OVER (PARTITION BY ${spots.id})`.as('respawnCount'),
    latestSpawnAt:   sql<number>`MAX(${spotFollowups.spawnedAt}) OVER (PARTITION BY ${spots.id})`.mapWith(sqlDateMapper).as('latestSpawnAt'),
    latestRemovedAt: sql<number>`MAX(${spotFollowups.removedAt}) OVER (PARTITION BY ${spots.id})`.mapWith(sqlDateMapper).as('latestRemovedAt'),
    maxFeedee:       sql<number>`MAX(${spotFollowups.feedeeCount}) OVER (PARTITION BY ${spots.id})`.as('maxFeedee'),
    rank:            sql<number>`RANK() OVER (PARTITION BY ${spots.id} ORDER BY ${spotFollowups.createdAt} DESC, ${spotFollowups.spawnedAt} DESC)`.as('rank'),
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
    followupDesc:   spotFollowups.desc,
    action:         spotFollowups.action,
    spotState:      spotFollowups.spotState,
    material:       spotFollowups.material,
    latestFollowAt: spotFollowups.createdAt,
    followCount:     ranked.followCount,
    followerCount:   ranked.followerCount,
    respawnCount:    ranked.respawnCount,
    latestSpawnAt:   ranked.latestSpawnAt,
    latestRemovedAt: ranked.latestRemovedAt,
    maxFeedee:       ranked.maxFeedee,
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

type GeoSpotsQuery = ReturnType<typeof geoSpots>;
export type GeoSpotsResult = Awaited<ReturnType<GeoSpotsQuery['execute']>>;
export type GeoSpotsByGeohash = {[key: string]: GeoSpotsResult};

export async function createSpot(data: CreateSpotSchema) {
  let result: {
    newSpot: InferSelectModel<typeof spots>,
    followup: InferSelectModel<typeof spotFollowups>,
  } | undefined;

  // await db.transaction(async (tx) => { // NOTE: D1 doesn't support transaction
  const newSpot = await db.insert(spots).values({
    title:   data.spotTitle,
    lat:     data.lat,
    lon:     data.lon,
    city:    data.city,
    town:    data.town,
    geohash: data.geohash,
    desc:    data.spotDesc,
    state:   PubStateEnum.enum.published,
    userId:  data.userId,
  }).returning().get();

  const followup = await db.insert(spotFollowups).values({
    action:      data.action,
    spotState:   data.action === 'remove' ? SpotStateEnum.enum.clean : SpotStateEnum.enum.dirty,
    desc:        data.desc,
    material:    data.material,
    feedeeCount: data.feedeeCount,
    state:       PubStateEnum.enum.published,
    spawnedAt:   data.spawnedAt,
    removedAt:   data.removedAt,
    spotId:      newSpot.id,
    userId:      data.userId,
  }).returning().get();

  result = { newSpot, followup };
  // });

  if (!result) {
    throw new Error("Can't insert spot and followup.")
  }

  return result;
}

export async function createFollowup(data: CreateFollowupSchema) {
  const followup = await db.insert(spotFollowups).values({
    action:      data.action,
    spotState:   data.action === 'remove' ? SpotStateEnum.enum.clean : SpotStateEnum.enum.dirty,
    desc:        data.desc,
    material:    data.material,
    feedeeCount: data.feedeeCount,
    state:       PubStateEnum.enum.published,
    spawnedAt:   data.spawnedAt,
    removedAt:   data.removedAt,
    spotId:      data.spotId,
    userId:      data.userId,
  }).returning().get();

  return followup;
}

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
