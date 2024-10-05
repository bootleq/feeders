'use server'

import * as R from 'ramda';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { SpotActionEnum } from '@/lib/schema';
import { parseFormData, zondedDateTimeSchema, ACCESS_CTRL } from '@/lib/utils';
import { createFollowup as save, geoSpots } from '@/models/spots';
import type { FieldErrors } from '@/components/form/store';

const formSchema = z.object({
  spotId: z.coerce.number().int().nonnegative(),
  action: SpotActionEnum,
  desc: z.string().nullish(),
  material: z.string().nullish(),
  feedeeCount: z.coerce.number().int().nonnegative(),
  spawnedAt: zondedDateTimeSchema,
  removedAt: zondedDateTimeSchema,
  geohash: z.string(),
});

type FormSchema = z.infer<typeof formSchema>;
export type Schema = FormSchema & {
  userId: string,
};

export async function createFollowup(formData: FormData) {
  if (ACCESS_CTRL !== 'open') return { errors: { _: ['功能未開放'] } };
  const session = await auth();

  if (!session) {
    return {
      errors: { _: ['未登入'] },
    }
  }
  const { user } = session;
  if (user.state !== 'active') return { errors: { _: ['使用者帳號不可用'] } };

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

  if (data.spawnedAt && R.isNil(data.material)) {
    addError('material', '須填寫');
  }

  if (data.spawnedAt && data.spawnedAt > now) {
    addError('spawnedAt', '不能是未來時間');
  }
  if (data.removedAt && data.removedAt > now) {
    addError('removedAt', '不能是未來時間');
  }

  try {
    if (R.isNotEmpty(errors)) {
      return {
        errors: errors,
        msg: '儲存前發生問題',
      };
    }

    const followup = await save({
      ...data,
      userId: session.userId,
    });

    const reloadSpots = await geoSpots([data.geohash]);

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
