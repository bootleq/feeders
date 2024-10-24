import { auth } from '@/lib/auth';
import type { Metadata } from "next";
import Image from 'next/image';
import Link from 'next/link';
import { SITE_NAME } from '@/lib/utils';
import { getWorldUsers } from '@/models/users';
import Sidebar from '@/components/Sidebar';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: '關於本站',
};

async function getUser(id: string | undefined) {
  if (id) {
    const users = await getWorldUsers(id);
    if (users) {
      return users[0];
    }
  }

  return null;
}

function Hr() {
  return <hr className='w-11/12 h-[2px] my-5 bg-slate-400/75 border-0' />;
}

export default async function Page() {
  const session = await auth();
  const user = await getUser(session?.userId);

  return (
    <main className="flex min-h-screen flex-row items-start justify-start">
      <Sidebar user={user} navTitle='關於' fixed={false} className={`max-h-screen scrollbar-thin flex flex-col pb-1 z-[410] bg-gradient-to-br from-stone-50 to-slate-200`}>
      </Sidebar>

      <div className='p-2 px-4 max-w-screen-sm space-y-6'>
        <h1 className='text-3xl py-3'>關於本站</h1>
        <p className=''>
          本站是由個人建立，起源於鄉里流浪狗問題的親身經驗，在當地，最關鍵的要素就是餵食，但大眾缺乏這個觀念，或刻意不面對。
        </p>
        <p>
          公共議題能否順利討論，與人民知識、道德與理性有直接關係。
        </p>
        <p>
          先進社會，一定能解決流浪狗問題。
        </p>

        <Hr />

        <h2 className='text-2xl'>時間線</h2>
        <ol>
          <li>
            <time className='font-mono mr-2'>2024-99-99</time>
            網站開始測試
          </li>
        </ol>

        <Hr />

        <h2 className='text-2xl'>聯絡信箱</h2>
        <address>human@feeders.***</address>
        <p>
          歡迎指教，不用拘謹
        </p>

        <Hr />

        <h2 className='text-2xl'>小額捐款</h2>
        <div className='flex items-center justify-between'>
          <p>
            沒有保證專款專用
          </p>
        </div>

      </div>
    </main>
  );
}