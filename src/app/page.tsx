import { users, accounts } from '@/lib/schema';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { SignIn } from '@/components/sign-in-button';
import { SignOut } from '@/components/sign-out-button';

export const runtime = 'edge';

export default async function Home() {
  const session = await auth();

  const rUsers = await db.select().from(users);
  const rAcs = await db.select().from(accounts);

  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <div className="z-10 w-full items-center justify-between text-sm lg:flex">
        { session ? <SignOut /> : <SignIn /> }
      </div>

      <div className="mb-32 text-center lg:w-full lg:mb-0 lg:text-left text-wrap whitespace-pre-wrap break-all">
        <h2 className='mt-5'>Users</h2>
        <code>
          {JSON.stringify(rUsers)}
        </code>

        <h2 className='mt-5'>Accounts</h2>
        <code>
          {JSON.stringify(rAcs)}
        </code>

        <h2 className='mt-5'>Session</h2>
        <code>
          {JSON.stringify(session)}
        </code>
      </div>
    </main>
  );
}
