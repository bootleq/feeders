import * as R from 'ramda';
import { eq, and, sql } from 'drizzle-orm';

import {
  areas,
} from '@/lib/schema';
import type { LatLngBounds } from '@/lib/schema';

import { db } from '@/lib/db';

export const runtime = 'edge';

export const saveArea = async (userId: string, areaId: number | null, bounds: LatLngBounds) => {
  if (areaId) {
    const items = await db.update(areas).set({
      bounds: bounds
    }).where(and(
      eq(areas.id, areaId),
      eq(areas.userId, userId),
    )).returning();

    if (!items?.length) {
      throw new Error('沒有符合 id / userId 的記錄');
    }
    return items;
  }

  const items = await db.insert(areas).values({
    userId: userId,
    bounds: bounds,
  }).returning();

  return items;
};
