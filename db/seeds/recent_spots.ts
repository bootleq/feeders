import chalk from 'chalk';
import * as R from 'ramda';
import { format } from 'node:util';
import { getLocalDB, schema, fakeAnimal, fakeText } from './utils';
import { eq, ne, gt, gte } from "drizzle-orm";
import { fakerZH_TW as faker } from '@faker-js/faker';
import { addHours, subDays } from '@/lib/date-fp';
import { MaterializedViewBuilder } from 'drizzle-orm/pg-core';

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
  lat: [24.970017, 24.992608],
  lon: [121.510496, 121.52979]
};

const today = R.tap(d => d.setHours(5), new Date());
const backwardDays = 3;

const latRestricted = () => faker.location.latitude({ max: geoRange.lat[1], min: geoRange.lat[0], precision: 9 });
const lonRestricted = () => faker.location.longitude({ max: geoRange.lon[1], min: geoRange.lon[0], precision: 9 });

async function main() {
  const author = await db.select()
    .from(users)
    .where(eq(users.state, 'new')) // TODO: should be 'active'
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

      const spawnedAt = subDays(ago, today);
      const spotValues = {
        title: fakeAnimal(),
        state: PubStateEnum.enum.published,
        desc: fakeText(),
        lat: latRestricted(),
        lon: lonRestricted(),
        userId: author.id,
      };
      const followupValueBase = {
        userId: author.id,
        spotId: null,
        action: SpotActionEnum.enum.see,
        spotState: SpotStateEnum.enum.dirty,
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

    console.log('Done.');
  });
}

main();
