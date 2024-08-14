"use client"

function TextBgHr() {
  return (
    <div className='relative flex-auto min-w-3' aria-hidden>
      <hr className='w-11/12 h-[2px] mx-auto my-5 bg-slate-400/75 border-0' />
    </div>
  );
}

export default function UserAgreement() {
  return (
    <>
      <h2 className='flex items-center justify-center gap-x-3 px-4 font-bold text-lg mt-2 text-center'>
        <TextBgHr />
        使用者須知
        <TextBgHr />
      </h2>
      <ul className='list-disc list-outside ml-5 space-y-3'>
        <li>
          使用者為自己行為負責，使用網站不得侵害他人權利；<br />
          遵守當地法律，法律為最低底線。
        </li>
        <li>
          餵食者常有偏執、不理性、暴力情況，<br />
          請留意不要輕易洩漏自己個資。<br />
          網站提供「現況」「現有」技術服務，<br />
          不承擔任何使用者個人風險。
        </li>
        <li>
          網站使用 OAuth 認證身分，主要只確認信箱，且不會公開。<br />
          盡力保護隱私，僅主管機關依法調閱的情況會交出資料。
        </li>
        <li>
          網站有權停止使用者的帳號，或刪除已發布的內容。
        </li>
      </ul>

      <div className='flex items-center justify-center font-mono text-xs text-slate-600 mt-4 text-center'>
        2024-08-14
      </div>
    </>
  );
}
