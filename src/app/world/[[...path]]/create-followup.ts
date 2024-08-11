'use server'

import * as R from 'ramda';
import { z } from 'zod';
import geohash from 'ngeohash';
import { auth } from '@/lib/auth';
import { SpotActionEnum } from '@/lib/schema';
import { parseFormData, zondedDateTimeSchema } from '@/lib/utils';
import { createFollowup as save, geoSpots } from '@/models/spots';
import type { FieldErrors } from '@/components/form/store';

const formSchema = z.object({
  spotId: z.coerce.number().int().nonnegative(),
  geohash: z.string().min(4),
  action: SpotActionEnum,
  desc: z.string().nullish(),
  material: z.string().nullish(),
  feedeeCount: z.coerce.number().int().nonnegative(),
  spawnedAt: zondedDateTimeSchema,
  removedAt: zondedDateTimeSchema,
});

type FormSchema = z.infer<typeof formSchema>;
export type Schema = FormSchema & {
  userId: string,
};

export async function createFollowup(formData: FormData) {
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
    if (errors.length) {
      return {
        errors: errors,
        msg: '儲存前發生問題',
      };
    }

    const followup = await save({
      ...data,
      userId: session.userId,
    });

    const reloadSpots = { [data.geohash]: await geoSpots([data.geohash]) };

    return {
      success: true,
      reloadSpots,
    };
  } catch (e) {
    console.log('create-followup failed', e);

    return {
      errors: { _: ['儲存失敗，意外的錯誤'] },
      msg: '後端儲存失敗',
    }
  }
};
