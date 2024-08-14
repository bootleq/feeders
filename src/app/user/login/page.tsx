import { auth, signIn } from '@/lib/auth';
import SubmitButton from './SubmitBtn';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const runtime = 'edge';

async function onSubmit() {
  "use server"

  try {
    await signIn('google');
  } catch (error) {
    // if (error instanceof AuthError) { }
    throw error;
  }
}

function TextBgHr() {
  return (
    <div className='relative flex-auto min-w-3' aria-hidden>
      <hr className='w-11/12 h-[2px] mx-auto my-5 bg-slate-400/75 border-0' />
    </div>
  );
}

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
          <h2 className='flex items-center justify-center gap-x-3 px-4 font-bold text-lg mt-2 text-center'>
            <TextBgHr />
            使用者須知
            <TextBgHr />
          </h2>
          <ul className='list-disc list-outside ml-5 space-y-3'>
            <li>
              使用者為自己的行為負責，不得侵害他人權利；<br />
              遵守法律，法律為最低底線。
            </li>
            <li>
              餵食者常有偏執、不理性、暴力情況，<br />
              請留意不要輕易洩漏自己個資。
            </li>
            <li>
              網站使用 Google OAuth 認證身分，只使用信箱，且不會公開。<br />
              盡力保護隱私，只有依法必須調閱的情況會交出資料。
            </li>
          </ul>
        </div>

        <hr className='w-11/12 h-px mx-auto my-6 bg-slate-400/75 border-0' />

        <form action={onSubmit} className='p-3 pb-6'>
          <SubmitButton />
        </form>

        <Link href='/' className='block w-fit mx-auto mt-5 mb-2 text-slate-500 hover:text-black'>算了，返回首頁</Link>
      </div>
    </main>
  );
}
