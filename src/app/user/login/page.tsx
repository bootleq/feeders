import type { Metadata } from "next";
import { auth, signIn } from '@/lib/auth';
import SubmitButton from '@/components/form/SubmitButton';
import UserAgreement from '@/app/user/UserAgreement';
import Link from 'next/link';
import { redirect } from 'next/navigation';

async function onSubmit() {
  "use server"

  try {
    await signIn('google');
  } catch (error) {
    // if (error instanceof AuthError) { }
    throw error;
  }
}

export const metadata: Metadata = {
  title: '使用者登入',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function Page() {
  const session = await auth();

  if (session) {
    return redirect('/');
  }

  return (
    <main className="flex max-w-screen-lg min-h-screen flex-row items-center justify-center">
      <div className='container max-w-screen-md min-h-screen md:min-h-fit w-fit p-4 bg-gradient-to-br from-stone-50 to-slate-200 md:rounded-lg md:shadow-lg'>
        <h1 className='mt-1 text-xl font-bold text-center'>Feeders 註冊／登入</h1>

        <div className='mt-4'>
          <UserAgreement />
        </div>

        <hr className='w-11/12 h-px mx-auto my-6 bg-slate-400/75 border-0' />

        <form action={onSubmit} className='p-3'>
          <SubmitButton className='block btn mx-auto ring-1 ring-offset-2 bg-gradient-to-br from-slate-100 to-pink-100 rounded-lg shadow-lg hover:ring-2 hover:scale-110'>
            同意，以 Google 帳號登入
          </SubmitButton>
        </form>

        <Link href='/' className='block w-fit mx-auto mt-5 mb-3 text-slate-500 hover:text-black'>算了，回首頁</Link>
      </div>
    </main>
  );
}
