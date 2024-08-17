import chalk from 'chalk';
import * as R from 'ramda';
import { format } from 'node:util';
import { getLocalDB, schema, fakeAnimal, fakeText } from './utils';
import { eq, ne, gt, gte } from "drizzle-orm";
import { fakerZH_TW as faker } from '@faker-js/faker';
import { addHours, subDays } from '@/lib/date-fp';
import geohash from 'ngeohash';
import { queryDistrict } from '@/models/spots';

const {
  users,
  spots,
  spotFollowups,
  PubStateEnum,
  SpotActionEnum,
  SpotStateEnum,
} = schema;

const db = getLocalDB();

const geoRange = {
  // 新北市小範圍
  // lat: [24.970017, 24.992608],
  // lon: [121.510496, 121.52979]
  //
  // 極點，會包括到海上
  // https://zh.wikipedia.org/wiki/臺灣之最列表/極點位置
  // lat: [21.7586, 25.6295],  // 北：彭佳嶼 南：七星岩
  // lon: [119.3144, 122.1069]  // 東：棉花嶼 西：花嶼
  //
  // 台灣本島，仍會包括到海上
  lat: [21.896900, 25.3056],
  lon: [120.035141, 122.007164]
};

const today = R.tap(d => d.setHours(5), new Date());
const backwardDays = 3;
const repeat = 10;
const queryDistrictSync = true;
const queryDistrictRetryLimit = 10;

const latRestricted = () => faker.location.latitude({ max: geoRange.lat[1], min: geoRange.lat[0], precision: 9 });
const lonRestricted = () => faker.location.longitude({ max: geoRange.lon[1], min: geoRange.lon[0], precision: 9 });

async function main() {
  const author = await db.select()
    .from(users)
    .where(eq(users.state, 'active'))
    .limit(1).get();

  if (!author) {
    throw new Error("Can't find active user.")
  }

  console.log(
    'Fabricate spots with author: %s (%s)',
    chalk.blueBright(author.email),
    chalk.gray(author.id)
  );

  const days = Array.from({ length: backwardDays }, (_, i) => i);

  await db.transaction(async (tx) => {
    for (let idx = 0; idx < days.length; idx++) {
      const ago = days[idx];

      let districtRetry = 0;
      let [lat, lon] = [latRestricted(), lonRestricted()];
      let [city, town] = queryDistrictSync ? await queryDistrict(lat, lon) : [null, null];

      while (
        queryDistrictSync &&
        districtRetry < queryDistrictRetryLimit &&
        R.any(R.isNil, [city, town])
      ) {
        districtRetry += 1;
        [lat, lon] = [latRestricted(), lonRestricted()];
        [city, town] = await queryDistrict(lat, lon);
      }

      const fakeAction = faker.helpers.weightedArrayElement([
        { weight: 6, value: SpotActionEnum.enum.see },
        { weight: 3, value: SpotActionEnum.enum.talk },
        { weight: 3, value: SpotActionEnum.enum.remove },
        { weight: 2, value: SpotActionEnum.enum.investig },
        { weight: 2, value: SpotActionEnum.enum.power },
        { weight: 2, value: SpotActionEnum.enum.coop },
        { weight: 1, value: SpotActionEnum.enum.downvote },
      ]);

      const fakeSpotState = faker.helpers.weightedArrayElement([
        { weight: 6, value: SpotStateEnum.enum.dirty },
        { weight: 3, value: SpotStateEnum.enum.clean },
        { weight: 2, value: SpotStateEnum.enum.tolerated },
      ]);

      const spawnedAt = subDays(ago, today);
      const spotValues = {
        title: fakeAnimal(),
        state: PubStateEnum.enum.published,
        desc: fakeText(),
        lat: lat,
        lon: lon,
        geohash: geohash.encode(lat, lon, 4),
        city: city,
        town: town,
        userId: author.id,
      };
      const followupValueBase = {
        userId: author.id,
        spotId: null,
        action: fakeAction,
        spotState: fakeSpotState,
        state: PubStateEnum.enum.published,
        desc: fakeText(),
        material: '雞脖子',
        feedeeCount: 3,
        spawnedAt: spawnedAt,
      }

      const newSpot = await db.insert(spots).values(spotValues).returning().get();

      const initialFollowup = await db.insert(spotFollowups)
        .values(
          R.mergeLeft({spotId: newSpot.id}, followupValueBase)
        ).returning().get();

      // Additional followups (removal / respawn) for 1st spot
      if (idx === 0) {
        const removalFollowup = await db.insert(spotFollowups)
          .values(
            R.mergeLeft({
              action: SpotActionEnum.enum.remove,
              desc: '已移除',
              spotState: SpotStateEnum.enum.clean,
              spawnedAt: null,
              removedAt: addHours(2, spawnedAt),
              spotId: newSpot.id
            }, followupValueBase)
          ).returning().get();

        const RespawnFollowup = await db.insert(spotFollowups)
          .values(
            R.mergeLeft({
              action: SpotActionEnum.enum.see,
              desc: '又重生了',
              material: '米腸',
              spotState: SpotStateEnum.enum.dirty,
              spawnedAt: addHours(4, spawnedAt!),
              spotId: newSpot.id
            }, followupValueBase)
          ).returning();
      }

      console.log(
        'Added spot %s at %s, %s',
        chalk.blueBright(newSpot.title),
        chalk.gray(newSpot.lat),
        chalk.gray(newSpot.lon)
      );
    }

    if (!queryDistrictSync) {
      console.log(chalk.yellow('NOTE district values were missing, to be filled later.'));
    }
  });
}

for (let idx = 0; idx < repeat; idx++) {
  main();
}
console.log('Done.');
