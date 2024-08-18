import * as R from 'ramda';
import {
  eq,
  lte,
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
  getTableName,
} from 'drizzle-orm';
import { XMLParser } from 'fast-xml-parser';

import {
  users,
  areas,
  spots,
  spotFollowups,
  changes,
  PubStateEnum,
  SpotStateEnum,
  sqlDateMapper,
} from '@/lib/schema';

import { getQuickProfileQuery } from './users';

import type { Schema as CreateSpotSchema } from '@/app/world/[[...path]]/create-spot';
import type { Schema as CreateFollowupSchema } from '@/app/world/[[...path]]/create-followup';
import type { Schema as AmendSpotSchema } from '@/app/world/[[...path]]/amend-spot';

import { db } from '@/lib/db';

export const runtime = 'edge';

// https://data.gov.tw/dataset/152915
const districtApiURL = 'https://api.nlsc.gov.tw/other/TownVillagePointQuery1/';
const xmlParser = new XMLParser();

const PRELOAD_FOLLOWUPS_SIZE = 3;

export const recentFollowups = (oldestDate: Date, fetchLimit: number) => {
  // Rank latest created followup
  const ranked = db.select({
    id:          spotFollowups.id,
    followCount: sql<number>`COUNT(${spots.id}) OVER (PARTITION BY ${spots.id})`.as('followCount'),
    rank:        sql<number>`RANK() OVER (PARTITION BY ${spots.id} ORDER BY ${spotFollowups.createdAt} DESC, ${spotFollowups.spawnedAt} DESC)`.as('rank'),
  }).from(spots)
    .innerJoin(spotFollowups, eq(spots.id, spotFollowups.spotId))
    .as('ranked')

  const profiles = getQuickProfileQuery().as('profiles');

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
    userName:    profiles.name,
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
    .innerJoin(
      profiles, eq(profiles.id, spotFollowups.userId)
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

export const geoSpotsQuery = (geohashes: string[]) => {
  // Rank latest created followups
  const ranked = db.select({
    id:              spots.id,
    followupId:      sql<number>`${spotFollowups.id}`.as('followupId'),
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

  const spotProfiles = getQuickProfileQuery().as('spotProfiles');
  const followupProfiles = getQuickProfileQuery().as('followupProfiles');

  const spotChanges = db.select({
    docId: changes.docId,
    count: sql<number>`COUNT()`.as('spotChangesCount')
  }).from(changes)
    .groupBy(changes.docId)
    .where(and(
      eq(changes.docType, getTableName(spots)),
      eq(changes.scope, 'amendSpot'),
    )).as('spotChanges');

  const query = db.select({
    spot: {
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
      userName: spotProfiles.name,
      changes: spotChanges.count,

      followCount:     ranked.followCount,
      followerCount:   ranked.followerCount,
      respawnCount:    ranked.respawnCount,
      latestSpawnAt:   ranked.latestSpawnAt,
      latestRemovedAt: ranked.latestRemovedAt,
      maxFeedee:       ranked.maxFeedee,
    },

    followup: {
      id:        spotFollowups.id,
      userId:    spotFollowups.userId,
      desc:      spotFollowups.desc,
      action:    spotFollowups.action,
      spotState: spotFollowups.spotState,
      material:  spotFollowups.material,
      createdAt: spotFollowups.createdAt,
      userName: followupProfiles.name,
    },
  }).from(ranked)
    .innerJoin(
      spots, and(
        eq(spots.id, ranked.id),
        lte(ranked.rank, PRELOAD_FOLLOWUPS_SIZE),
      )
    )
    .innerJoin(
      spotFollowups,
      eq(spotFollowups.id, ranked.followupId)
    ).innerJoin(
      spotProfiles, eq(spotProfiles.id, spots.userId)
    ).innerJoin(
      followupProfiles, eq(followupProfiles.id, spotFollowups.userId)
    ).leftJoin(
      spotChanges, eq(spotChanges.docId, spots.id)
    ).where(
      and(
        inArray(spots.state, [PubStateEnum.enum.published, PubStateEnum.enum.dropped]),
        inArray(spotFollowups.state, [PubStateEnum.enum.published, PubStateEnum.enum.dropped]),
        inArray(spots.geohash, geohashes),
      )
    )
    .orderBy(
      asc(spots.geohash), desc(spotFollowups.createdAt),
    );

  return query;
};

type GeoSpotsQuery = ReturnType<typeof geoSpotsQuery>;
export type GeoSpotsQueryResult = Awaited<ReturnType<GeoSpotsQuery['execute']>>;

export type GeoSpotsResultSpot = GeoSpotsQueryResult[number]['spot'];
export type GeoSpotsResultFollowup = GeoSpotsQueryResult[number]['followup'];
export type GeoSpotsResult = {
  spot: GeoSpotsResultSpot,
  followups: GeoSpotsResultFollowup[],
};
export type GeoSpotsByGeohash = {
  [geohash: string]: GeoSpotsResult[]
};

export const geoSpots = async (geohashes: string[]) => {
  const items = await geoSpotsQuery(geohashes);

  const bySpot = items.reduce<Record<number, { spot: GeoSpotsResultSpot, followups: GeoSpotsResultFollowup[] }>>(
    (acc, row) => {
      const { spot, followup } = row;
      const { geohash } = spot;

      if (!acc[spot.id]) {
        acc[spot.id] = { spot, followups: [] };
      }
      if (followup) {
        acc[spot.id].followups.push(followup);
      }
      return acc;
    },
    {}
  )

  const byGeohash = Object.values(bySpot).reduce<GeoSpotsByGeohash>(
    (acc, row) => {
      const { spot, followups } = row;
      const { geohash } = spot;

      if (!acc[geohash]) acc[geohash] = [];
      acc[geohash].push({ spot, followups });
      return acc;
    },
    {}
  );

  return R.reject(R.isNil, byGeohash);
};

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

export const getFollowups = async (spotId: number) => {
  const items = await db.select({
    id:        spotFollowups.id,
    userId:    spotFollowups.userId,
    desc:      spotFollowups.desc,
    action:    spotFollowups.action,
    spotState: spotFollowups.spotState,
    material:  spotFollowups.material,
    createdAt: spotFollowups.createdAt,
  }).from(spotFollowups)
    .innerJoin(spots, eq(spots.id, spotFollowups.spotId))
    .where(
      and(
        inArray(spots.state, [PubStateEnum.enum.published, PubStateEnum.enum.dropped]),
        inArray(spotFollowups.state, [PubStateEnum.enum.published, PubStateEnum.enum.dropped]),
        eq(spotFollowups.spotId, spotId),
      )
    ).orderBy(
      desc(spotFollowups.createdAt),
    );

  return items;
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
