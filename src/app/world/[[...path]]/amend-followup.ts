'use server'

import * as R from 'ramda';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { diffForm } from '@/lib/diff';
import { spotFollowups, changes } from '@/lib/schema';
import { PubStateEnum, SpotActionEnum } from '@/lib/schema';
import { and, eq, getTableName } from 'drizzle-orm';
import { parseFormData, zondedDateTimeSchema } from '@/lib/utils';
import { getFollowups } from '@/models/spots';
import type { FieldErrors } from '@/components/form/store';

const formSchema = z.object({
  id: z.coerce.number().int().nonnegative(),
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

const diffProps = ['action', 'desc', 'material', 'feedeeCount', 'spawnedAt', 'removedAt'] as const;

export async function amendFollowup(formData: FormData) {
  const session = await auth();
  if (!session) return { errors: { _: ['未登入'] } };

  const { user } = session;
  if (user.state !== 'active') return { errors: { _: ['使用者帳號不可用'] } };

  const params = parseFormData(formData);
  const now = new Date();

  const validated = formSchema.safeParse(params);
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

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
    data['removedAt'] = null;
  }

  if (data.spawnedAt && data.spawnedAt > now) {
    addError('spawnedAt', '不能是未來時間');
  }
  if (data.removedAt && data.removedAt > now) {
    addError('removedAt', '不能是未來時間');
  }

  const followup = await db.select({
    action: spotFollowups.action,
    desc: spotFollowups.desc,
    material: spotFollowups.material,
    feedeeCount: spotFollowups.feedeeCount,
    spawnedAt: spotFollowups.spawnedAt,
    removedAt: spotFollowups.removedAt,
    userId: spotFollowups.userId,
    spotId: spotFollowups.spotId,
  }).from(spotFollowups)
    .where(and(
      eq(spotFollowups.id, data.id),
      eq(spotFollowups.state, PubStateEnum.enum.published),
    )).get();

  if (!followup) return { errors: { _: ['跟進不存在'] } };
  if (followup?.userId !== user.id) return { errors: { _: ['跟進不可由目前使用者編輯'] } };

  try {
    const changeset = diffForm(
      R.pick(diffProps, followup),
      R.pick(diffProps, data),
    );

    if (R.isNil(changeset)) return { errors: { _: ['偵測不到變動的內容'] } };

    if (R.isNotEmpty(errors)) {
      return {
        errors: errors,
        msg: '儲存前發生問題',
      };
    }

    const changesWithDefaultNull = {
      ...diffProps.reduce((acc, key) => R.assoc(key, null, acc), {}),
      ...changeset.new
    };

    await db.batch([
      db.update(spotFollowups)
      .set(changeset.new)
      .where(eq(spotFollowups.id, data.id)),

      db.insert(changes).values({
        docType: getTableName(spotFollowups),
        docId: data.id.toString(),
        scope: 'amendFollowup',
        whodunnit: user.id,
        content: changeset.old,
      }).returning({ id: changes.id})
    ]);

    const reloadFollowups = await getFollowups(followup.spotId!);

    return {
      success: true,
      spotId: followup.spotId,
      reloadFollowups,
    };
  } catch (e) {
    console.log('amend-followup failed', e);

    return {
      errors: { _: ['儲存失敗，意外的錯誤'] },
      msg: '後端儲存失敗',
    }
  }
};
