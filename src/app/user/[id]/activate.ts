'use server'

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { users } from '@/lib/schema';
import { UserStateEnum } from '@/lib/schema';

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

  await db.update(users).set({
    state: UserStateEnum.enum.active,
  }).where(and(
    eq(users.id, user.id as string),
    eq(users.state, UserStateEnum.enum.new),
  ));

  revalidatePath(`/user/${session.user.id}`);

  return {
    success: true
  };
};
