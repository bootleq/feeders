'use server'

import * as R from 'ramda';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { and, eq, inArray, getTableName } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { parseFormData, blank, ACCESS_CTRL } from '@/lib/utils';
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

function revalidate(id?: number) {
  if (!id) return;
  revalidatePath('/api/picks/');
  revalidatePath('/facts/picks/');
  revalidatePath(`/facts/picks/${id}/`);
}

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

  const validated = formSchema.safeParse(params);
  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const { data } = validated;
  let errors: FieldErrors = {};
  let hardProps: Record<string, any> = {};

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
      publishedAt: factPicks.publishedAt,
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
        if (
          blank(pick.publishedAt) &&
          R.pathEq(PickStateEnum.enum.published, ['new', 'state'], changeset)
        ) {
          hardProps['publishedAt'] = new Date();
        }

        await db.batch([
          db.update(factPicks)
            .set({ ...hardProps, ...changeset.new })
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

      const freshItem = (await getPickById(data.id, user.id)).pop();
      revalidate(freshItem?.id);

      return {
        success: true,
        item: freshItem,
      };
    } catch (e) {
      console.log("save-pick (update) failed:\n", e);

      return {
        errors: { _: ['儲存失敗，意外的錯誤'] },
        msg: '後端儲存失敗',
      }
    }

  } else {
    // Create new record
    try {
      if (data.state === PickStateEnum.enum.published) {
        hardProps['publishedAt'] = new Date();
      }

      const newPick = await save({
        ...data,
        ...hardProps,
        userId: session.userId,
      });

      const freshItem = (await getPickById(newPick.id, user.id)).pop();
      revalidate(freshItem?.id);

      return {
        success: true,
        item: freshItem,
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
