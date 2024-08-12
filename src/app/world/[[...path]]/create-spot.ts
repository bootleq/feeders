'use server'

import * as R from 'ramda';
import { z } from 'zod';
import geohash from 'ngeohash';
import { auth } from '@/lib/auth';
import { SpotActionEnum } from '@/lib/schema';
import { parseFormData, zondedDateTimeSchema } from '@/lib/utils';
import { queryDistrict, createSpot as save, geoSpots } from '@/models/spots';
import type { FieldErrors } from '@/components/form/store';

const formSchema = z.object({
  spotTitle: z.string().nullish(),
  spotDesc: z.string().nullish(),
  action: SpotActionEnum,
  desc: z.string().nullish(),
  material: z.string().nullish(),
  feedeeCount: z.coerce.number().int().nonnegative(),
  lat: z.coerce.number().gte(-90).lte(90),
  lon: z.coerce.number().gte(-180).lte(180),
  spawnedAt: zondedDateTimeSchema,
  removedAt: zondedDateTimeSchema,
});

type FormSchema = z.infer<typeof formSchema>;
export type Schema = FormSchema & {
  city: string,
  town: string,
  geohash: string,
  userId: string,
};

export async function createSpot(formData: FormData) {
  const session = await auth();

  if (!session) {
    return {
      errors: { _: ['未登入'] },
    }
  }

  const params = parseFormData(formData);
  const now = new Date();

  const validated = formSchema.safeParse(params);
  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const { data } = validated;
  let errors: FieldErrors = {};

  const addError = (key: string, msg: string) => {
    if (!errors[key]) errors[key] = [];
    errors[key].push(msg);
  }

  if (data['action'] === 'remove') {
    if (R.isNil(data.removedAt)) {
      addError('removedAt', '須填寫');
    }
  } else {
    delete data.removedAt;
  }

  if (data.spawnedAt && data.spawnedAt > now) {
    addError('spawnedAt', '不能是未來時間');
  }
  if (data.removedAt && data.removedAt > now) {
    addError('removedAt', '不能是未來時間');
  }

  try {
    const [city, town] = await queryDistrict(data.lat, data.lon);
    const ghash = geohash.encode(data.lat, data.lon, 4);

    if (R.any(R.isNil, [city, town, ghash])) {
      addError('_', '解析地址失敗');
    }

    if (errors.length) {
      return {
        errors: errors,
        msg: '儲存前發生問題',
      };
    }

    const { newSpot, followup } = await save({
      ...data,
      city: city!,
      town: town!,
      geohash: ghash,
      userId: session.userId,
    });

    const reloadSpots = await geoSpots([ghash]);

    return {
      success: true,
      reloadSpots,
    };
  } catch (e) {
    console.log('create-spot failed', e);

    return {
      errors: { _: ['儲存失敗，意外的錯誤'] },
      msg: '後端儲存失敗',
    }
  }
};
