import { describe, expect, test } from 'vitest';

import { spotsMissingDistrict } from './spots';
import { QueryBuilder } from 'drizzle-orm/sqlite-core';

describe('spotsMissingDistrict', () => {
  test('can generate sub query (to be consumed by db seed)', () => {
    const sq = spotsMissingDistrict().as('sq');

    const qb = new QueryBuilder();
    const query = qb.select().from(sq).toSQL();

    const { sql } = query;

    expect(sql).toMatch('select');
  });
})
