'use server'

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { eq, and, getTableName } from 'drizzle-orm';
import { users, changes, UserStateEnum } from '@/lib/schema';

export default async function saveUserArea() {
  const session = await auth();

  if (!session) {
    return {
      error: '未登入',
    }
  }

  const { user } = session;

  if (user.state !== UserStateEnum.enum.new) {
    return {
      error: '使用者狀態不正確',
    }
  }
  if (!user.id) throw new Error('no user id');

  try {
    await db.batch([
      db.update(users).set({
        state: UserStateEnum.enum.active,
      }).where(and(
        eq(users.id, user.id as string),
        eq(users.state, UserStateEnum.enum.new),
      )),

      db.insert(changes).values({
        docType: getTableName(users),
        docId: user.id,
        scope: 'state',
        whodunnit: user.id,
        content: 'active',
      }).returning({ id: changes.id})
    ]);
  } catch (e) {
    console.log('activate', e);
    return { error: '儲存失敗，非預期的錯誤' };
  }

  revalidatePath(`/user/${session.user.id}`);

  return {
    success: true
  };
};
