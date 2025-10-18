'use server'

import * as R from 'ramda';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { and, eq, inArray, getTableName } from 'drizzle-orm';
import { parseFormData, ACCESS_CTRL } from '@/lib/utils';
import { diffForm } from '@/lib/diff';
import { factPicks, changes } from '@/lib/schema';
import { createPick as save, getPickById } from '@/models/facts';
import type { FieldErrors } from '@/components/form/store';

const PickStateEnum = z.enum(['draft', 'published'] as const);

const formSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  title: z.string().nullish(),
  desc: z.string().nullish(),
  factIds: z.array(z.number().int().positive()).min(1),
  state: PickStateEnum,
});
const createSchema = formSchema.omit({ id: true });
export type CreateSchema = z.infer<typeof createSchema> & { userId: string };

const diffProps = ['title', 'desc', 'factIds', 'state'] as const;

export async function savePick(formData: FormData) {
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

  // Parse factIds from JSON
  const idsJSON = params['factIds']?.toString() || '[]';
  params['factIds'] = JSON.parse(idsJSON);

  const schema = params['id'] ? formSchema : createSchema;
  const validated = schema.safeParse(params);
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

  if (data.id) {
    // Update existing record
    const db = getDb();
    const pick = await db.select({
      userId: factPicks.userId,
      title: factPicks.title,
      desc: factPicks.desc,
      factIds: factPicks.factIds,
      state: factPicks.state,
    }).from(factPicks)
      .where(and(
        eq(factPicks.id, data.id),
        inArray(factPicks.state, ['draft', 'published']),
      )).get();

    if (!pick) return { errors: { _: ['選集不存在'] } };
    if (pick?.userId !== user.id) return { errors: { _: ['資料不可由目前使用者編輯'] } };

    try {
      const changeset = diffForm(
        R.pick(diffProps, pick),
        R.pick(diffProps, data),
      )
      if (R.isNil(changeset)) return { errors: { _: ['偵測不到變動的內容'] } };

      if (R.isNotEmpty(errors)) {
        return {
          errors: errors,
          msg: '儲存前發生問題',
        };
      }

      // Skip saving changes if staying in "draft"
      if (pick.state === PickStateEnum.enum.draft && !R.hasPath(['new', 'state'], changeset)) {
        await db.update(factPicks)
                .set(changeset.new)
                .where(eq(factPicks.id, data.id))
      } else {
        await db.batch([
          db.update(factPicks)
            .set(changeset.new)
            .where(eq(factPicks.id, data.id)),

          db.insert(changes).values({
            docType: getTableName(factPicks),
            docId: data.id.toString(),
            scope: 'amendPick',
            whodunnit: user.id,
            content: changeset.old,
          }).returning({ id: changes.id})
        ]);
      }

      const freshItems = await getPickById(data.id);

      return {
        success: true,
        item: freshItems.pop(),
      };
    } catch (e) {
      console.log('save-pick (update) failed', e);

      return {
        errors: { _: ['儲存失敗，意外的錯誤'] },
        msg: '後端儲存失敗',
      }
    }

  } else {
    // Create new record
    try {
      const newPick = await save({
        ...data,
        userId: session.userId,
      });

      return {
        success: true,
        item: newPick,
      };
    } catch (e) {
      console.log('save-pick (create) failed', e);

      return {
        errors: { _: ['儲存失敗，意外的錯誤'] },
        msg: '後端儲存失敗',
      }
    }
  }
};
