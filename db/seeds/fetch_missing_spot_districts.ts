import * as R from 'ramda';
import chalk from 'chalk';
import {
  eq,
  gte,
  isNull,
  or,
  and,
  inArray,
  desc,
  sql,
} from 'drizzle-orm';
import { getLocalDB, schema } from './utils';
import { queryDistrict, spotsMissingDistrict } from '@/models/spots';

const { spots } = schema;

const db = getLocalDB();

async function main() {
  const sq = spotsMissingDistrict().as('sq');
  const items = await db.select().from(sq).all();
  const values = [];

  if (R.isEmpty(items)) {
    console.log("Can't find spots with district missing.");
    return;
  }

  console.log(`Start query district for ${chalk.greenBright(items.length)} records...`);

  for (let idx = 0; idx < items.length; idx++) {
    const i = items[idx];
    const [city, town] = await queryDistrict(i.lat!, i.lon!);

    values.push({
      id: i.id,
      city: city,
      town: town,
    });
  }

  console.log("Updating db with values:\n", values);

  // const result = await db.insert(spots)
  //   .values(values)
  //   .onConflictDoUpdate({
  //     target: spots.id,
  //     set: {
  //       city: sql.raw(`excluded.${spots.city.name}`),
  //       town: sql.raw(`excluded.${spots.town.name}`),
  //     }
  //   });

  console.log('Done.');
}

main();
