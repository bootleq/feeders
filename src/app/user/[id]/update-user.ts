'use server'

import { z } from 'zod';
import { differenceInDays } from 'date-fns';
import { format } from '@/lib/date-fp';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import { parseFormData, ACCESS_CTRL } from '@/lib/utils';
import { eq, and, getTableName } from 'drizzle-orm';
import { users, changes, UserStateEnum } from '@/lib/schema';
import { getQuickProfileQuery, RENAME_COOL_OFF_DAYS, getPickIds } from '@/models/users';

const formSchema = z.object({
  field: z.enum(['name', 'desc']),
  value: z.string().nullable(),
});

export default async function updateUser(formData: FormData) {
  if (ACCESS_CTRL !== 'open') return { error: '功能未開放' };

  const session = await auth();

  if (!session) return { error: '未登入' }

  const params = parseFormData(formData);
  const now = new Date();
  const validated = formSchema.safeParse(params);

  if (!validated.success) return { error: '輸入資料錯誤' };

  const { data } = validated;
  const { user } = session;

  if (user.state !== UserStateEnum.enum.active) return { error: '帳號不可用' };
  if (!user.id) throw new Error('no user id');

  const db = getDb();

  if (data.field === 'name') {
    if (!data.value || data.value.trim() === '') {
      return { error: '名稱不可以空白' };
    }
    const query = getQuickProfileQuery().where(eq(users.id, user.id));
    const qProfile = await query.get();
    if (!qProfile) return { error: '無法取得 profile' };

    const { renames } = qProfile;
    if (renames) {
      const latestRenameAt = new Date(renames[0].time);
      const dayDiff = differenceInDays(now, latestRenameAt);
      if (dayDiff < RENAME_COOL_OFF_DAYS) {
        const modDay = format({}, 'M/d', latestRenameAt);
        return { error: `上次改名時間是 ${modDay}，經過 ${RENAME_COOL_OFF_DAYS} 天才能再修改` };
      }
    }

    try {
      await db.batch([
        db.update(users).set({
          name: data.value,
        }).where(eq(users.id, user.id)),

        db.insert(changes).values({
          docType: getTableName(users),
          docId: user.id,
          scope: data.field,
          whodunnit: user.id,
          content: user.name || '',
        }).returning({ id: changes.id})
      ]);
    } catch (e) {
      console.log('update-user', e);
      return { error: '儲存失敗，非預期的錯誤' };
    }

    try {
      revalidatePath(`/user/${session.user.id}`);

      const picks = await getPickIds(user.id);
      if (picks.length > 0) {
        revalidatePath('/api/picks/');
        revalidatePath('/facts/picks/');
        picks.forEach(pick => {
          revalidatePath(`/facts/picks/${pick.id}/`);
          revalidatePath(`/audit/pick/${pick.id}/`);
        });
      }
    } catch (e) {
      console.error({
        'update-user': 'revalidatePath failed',
        error: e,
      });
    }

    return { success: true };
  } else if (data.field === 'desc') {
    try {
      await db.update(users)
        .set({ desc: data.value })
        .where(eq(users.id, user.id));
    } catch (e) {
      console.log('update-user', e);
      return { error: '儲存失敗，非預期的錯誤' };
    }

    revalidatePath(`/user/${session.user.id}`);
    return { success: true };
  }

  return { error: '非預期的錯誤' };
};
