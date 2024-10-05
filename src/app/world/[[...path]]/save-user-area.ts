'use server'

import * as R from 'ramda';
import { z } from 'zod';
import geohash from 'ngeohash';
import { auth } from '@/lib/auth';
import { GEOHASH_PRECISION } from './util';
import { parseFormData, ACCESS_CTRL } from '@/lib/utils';
import { saveArea } from '@/models/users';
import type { LatLngBounds } from '@/lib/schema';

const schema = z.object({
  id: z.nullable(z.coerce.number().int().positive()),
  bbox: z.string().transform((v, ctx) => {
    const array = v.split(',').map(Number);
    if (array.length === 4) {
      return array;
    } else {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '輸入格式不正確',
      });
      return z.NEVER;
    }
  }).pipe(
    z.tuple([z.number(), z.number(), z.number(), z.number()])
  )
})

export async function saveUserArea(formData: FormData) {
  if (ACCESS_CTRL !== 'open') {
    return {
      errors: '功能未開放',
      msg: '功能未開放'
    };
  }

  const session = await auth();

  if (!session) {
    return {
      errors: 'unauthorized',
      msg: '未登入',
    }
  }
  const { user } = session;
  if (user.state !== 'active') {
    return {
      errors: '使用者帳號不可用',
      msg: '未登入',
    };
  }

  const params = parseFormData(formData);
  const validated = schema.safeParse(params);
  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      msg: '輸入格式無效',
    }
  }

  const { data } = validated;
  const hashes = geohash.bboxes(...data.bbox, GEOHASH_PRECISION);

  if (hashes.length > 4) {
    return {
      errors: `範圍過大：${JSON.stringify(hashes)}`,
      msg: '選定範圍過大',
    }
  }
  // bounds 和 bbox 是相反的
  // bbox -> 'southwest_lng,southwest_lat,northeast_lng,northeast_lat'
  // bbounds -> northeast, southwest
  const bounds: LatLngBounds = [
    [data.bbox[3], data.bbox[2]],
    [data.bbox[1], data.bbox[0]],
  ];

  try {
    const saved = await saveArea(session.userId, data.id, bounds)
    return {
      success: true,
      item: saved[0],
    };
  } catch (e) {
    console.log('saveArea', e);

    return {
      errors: '例外',
      msg: '後端儲存失敗',
    }
  }
}
