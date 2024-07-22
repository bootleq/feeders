import * as R from 'ramda';
import {
  eq,
  gte,
  isNull,
  isNotNull,
  or,
  and,
  inArray,
  desc,
  sql,
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
    district:    spots.district,
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

    const district = R.pipe(
      R.prop('townVillageItem'),
      R.props(['ctyName', 'townName']),
      R.join(' ')
    )(json);

    if (R.isNotEmpty(district)) {
      return district;
    }
  }

  return null;
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
        isNull(spots.district),
        eq(spots.district, ''),
      ),
    )
  );

  return query;
}
