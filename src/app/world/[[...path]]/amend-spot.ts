'use server'

import * as R from 'ramda';
import { z } from 'zod';
import geohash from 'ngeohash';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { diffForm } from '@/lib/diff';
import { spots, changes } from '@/lib/schema';
import { PubStateEnum } from '@/lib/schema';
import { and, eq, getTableName } from 'drizzle-orm';
import { parseFormData } from '@/lib/utils';
import { queryDistrict, geoSpots } from '@/models/spots';
import type { FieldErrors } from '@/components/form/store';

const formSchema = z.object({
  id: z.coerce.number(),
  spotTitle: z.string().nullish(),
  spotDesc: z.string().nullish(),
  lat: z.coerce.number().gte(-90).lte(90),
  lon: z.coerce.number().gte(-180).lte(180),
});

type FormSchema = z.infer<typeof formSchema>;
export type Schema = FormSchema & {
  city: string,
  town: string,
  geohash: string,
  userId: string,
};

const diffProps = ['title', 'desc', 'lat', 'lon'] as const;

export async function amendSpot(formData: FormData) {
  const session = await auth();
  if (!session) return { errors: { _: ['未登入'] } };

  const { user } = session;
  if (user.state !== 'active') return { errors: { _: ['使用者帳號不可用'] } };

  const params = parseFormData(formData);
  const reloadHashes = [];

  const validated = formSchema.safeParse(params);
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const { data } = validated;
  let errors: FieldErrors = {};

  const addError = (key: string, msg: string) => {
    if (!errors[key]) errors[key] = [];
    errors[key].push(msg);
  }

  const spot = await db.select({
    title: spots.title,
    desc: spots.desc,
    state: spots.state,
    lat: spots.lat,
    lon: spots.lon,
    geohash: spots.geohash,
    userId: spots.userId,
  }).from(spots)
    .where(and(
      eq(spots.id, data.id),
      eq(spots.state, PubStateEnum.enum.published),
    )).get();

  if (!spot) return { errors: { _: ['地點不存在'] } };
  if (spot?.userId !== user.id) return { errors: { _: ['地點不可由目前使用者編輯'] } };

  reloadHashes.push(spot.geohash);

  try {
    const changeset = diffForm(
      R.pick(diffProps, spot),
      R.pick(diffProps, { ...data, title: data.spotTitle, desc: data.spotDesc }),
    )

    if (R.isNil(changeset)) return { errors: { _: ['偵測不到變動的內容'] } };

    if (R.has('lat', changeset.new) || R.has('lon', changeset.new)) {
      const [city, town] = await queryDistrict(data.lat, data.lon);
      const ghash = geohash.encode(data.lat, data.lon, 4);
      reloadHashes.push(ghash);

      if (R.any(R.isNil, [city, town, ghash])) {
        addError('_', '解析地址失敗');
      } else {
        Object.assign(
          changeset.new,
          {
            city,
            town,
            geohash: ghash,
          }
        );
      }
    }

    if (R.isNotEmpty(errors)) {
      return {
        errors: errors,
        msg: '儲存前發生問題',
      };
    }

    await db.batch([
      db.update(spots)
      .set(changeset.new)
      .where(eq(spots.id, data.id)),

      db.insert(changes).values({
        docType: getTableName(spots),
        docId: data.id.toString(),
        scope: 'amendSpot',
        whodunnit: user.id,
        content: changeset.old,
      }).returning({ id: changes.id})
    ]);

    const reloadSpots = await geoSpots(R.uniq(reloadHashes));

    return {
      success: true,
      reloadSpots,
    };
  } catch (e) {
    console.log('amend-spot failed', e);

    return {
      errors: { _: ['儲存失敗，意外的錯誤'] },
      msg: '後端儲存失敗',
    }
  }
};
