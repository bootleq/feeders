import type { Metadata } from "next";
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import UserAgreement from '@/app/user/UserAgreement';
import { TERM_DATE } from './util';

const TITLE = '網站使用條款';

export const metadata: Metadata = {
  title: TITLE,
};

function Hr() {
  return <hr className='w-11/12 h-[2px] my-5 bg-slate-400/75 border-0' />;
}

function PicksLink() {
  return (
    <Link className='rounded-md w-fit hover:bg-amber-300/50' href='/facts/picks/'>事實選集</Link>
  );
}

export default async function Page() {
  return (
    <main className="flex min-h-screen flex-row items-start justify-start">
      <Sidebar navTitle='使用條款' fixed={false} className={`peer max-h-screen scrollbar-thin flex flex-col pb-1 z-[410] bg-gradient-to-br from-stone-50 to-slate-200`}>
      </Sidebar>

      <div className='p-2 px-4 w-full h-screen overflow-auto peer-[[aria-expanded="false"]]:pt-8'>
        <div className='max-w-screen-sm space-y-6'>
          <h1 className='flex items-center text-3xl py-3'>
            {TITLE}
            <small className='ml-auto font-mono text-slate-600 text-center'>{TERM_DATE}</small>
          </h1>

          <p>
            網站內容未特別宣告授權者（幾乎全站都是），依一般法律規定。
          </p>

          <Hr />

          <h2 className='text-2xl'>使用者資料運用</h2>

          <p className="">
            由註冊使用者提交的內容（帳號公開資訊、地圖座標、地點資訊、<PicksLink />等），發布後即視為同意於本站公開；
          </p>
          <p>
            另外，座標、地點等事實性記錄資訊，不具著作權保護態樣者，本站基於資料開放目的，可以進行整理並公開發布
            <span className="text-slate-600">
              （例如：匯出所有餵食點，方便其他服務運用）
            </span>
            。
          </p>

          <Hr />

          <h2 className='text-2xl'>註冊時顯示的使用者須知</h2>

          <div className="w-max -translate-y-2 p-4 pb-6 ml-1 rounded-lg md:shadow-lg bg-gradient-to-br from-stone-50 to-slate-200 backdrop:bg-black/50">
            <UserAgreement />
          </div>

        </div>
      </div>
    </main>
  );
}
