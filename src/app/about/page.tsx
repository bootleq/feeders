import type { Metadata } from "next";
import { SITE_NAME, SITE_CONTACT_EMAIL } from '@/lib/utils';
import Sidebar from '@/components/Sidebar';
import RepoLink from './RepoLink';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: '關於本站',
};

function Hr() {
  return <hr className='w-11/12 h-[2px] my-5 bg-slate-400/75 border-0' />;
}

export default async function Page() {
  return (
    <main className="flex min-h-screen flex-row items-start justify-start">
      <Sidebar navTitle='關於' fixed={false} className={`peer max-h-screen scrollbar-thin flex flex-col pb-1 z-[410] bg-gradient-to-br from-stone-50 to-slate-200`}>
      </Sidebar>

      <div className='p-2 px-4 w-full h-screen overflow-auto peer-[[aria-expanded="false"]]:pt-8'>
        <div className='max-w-screen-sm space-y-6'>
          <h1 className='text-3xl py-3'>關於本站</h1>
          <p className=''>
            本站由個人建立，起源於鄉里流浪狗問題的親身經驗，在當地，最關鍵的要素就是餵食，但民眾缺乏這個觀念，或囿於成見，刻意不面對。
          </p>
          <p>
            做了很多功課，認為情況並非無可救藥，而是資訊屏障、無效溝通阻礙著我們。
          </p>
          <p>
            公共議題能否順利討論，與人民知識、道德與理性有直接關係。
          </p>
          <p>
            當人心提昇，以更高格局看待，先進社會，一定能解決流浪狗問題。
          </p>

          <Hr />

          <h2 className='text-2xl'>關於測試</h2>
          <p>
            網站目前是測試階段。
            使用者和上傳的資料，日後可能會清空重來。
          </p>

          <Hr />

          <h2 className='text-2xl'>時間線</h2>
          <ol>
            <li>
              <time className='font-mono mr-2'>2024-11-04</time>
              初期測試
            </li>
            <li>
              <time className='font-mono mr-2'>2025-02-24</time>
              圖表頁上線
            </li>
          </ol>

          <Hr />

          <div className='grid sm:grid-cols-[auto_1fr] items-center gap-x-5 gap-y-3'>
            <span>原始碼</span>
            <RepoLink />

            <span>聯絡信箱</span>
            <div className='flex items-center justify-start px-2 gap-x-5'>
              <address className='hover:underline px-1'>{SITE_CONTACT_EMAIL}</address>
              <p className='text-slate-600'>
                歡迎指教，不用拘謹
              </p>
            </div>
          </div>

          <Hr />

          <h2 className='text-2xl'>捐款</h2>
          <p>
            不保證專款專用
          </p>

          <a className='block' target='_blank' href="https://www.buymeacoffee.com/bootleq">
            <img alt='Buy me a coffee' src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=bootleq&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" width='235' height='50' />
          </a>
        </div>
      </div>
    </main>
  );
}
