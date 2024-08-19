import * as R from 'ramda';
import { auth } from '@/lib/auth';
import { Fragment } from 'react';
import { SpotActionEnum } from '@/lib/schema';
import { format } from '@/lib/date-fp';
import { getWorldUsers, getProfile } from '@/models/users';
import { notFound } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import BasicInfo from './BasicInfo';
import ActionLabel from '@/app/world/[[...path]]/ActionLabel';
import { MapIcon } from '@heroicons/react/24/solid';
import { TrophyIcon } from '@heroicons/react/24/solid';
import { PencilIcon } from '@heroicons/react/24/outline';

export const runtime = 'edge';

async function getUser(id: string | undefined) {
  if (id) {
    const users = await getWorldUsers(id);
    if (users) {
      return users[0];
    }
  }

  return null;
}

function parseActionCounts(json: string) {
  const source = JSON.parse(json) as { action: string, count: number }[];
  const result = source.reduce<Record<string, number>>(
    (acc, { action, count }) => {
      acc[action] = count;
      return acc;
    }, {});
  return result;
}

const cardCls = 'my-2 px-4 pt-3 pb-4 ring-1 bg-slate-200 rounded-lg shadow-lg';

export default async function Page({ params }: {
  params: { id: string }
}) {
  const session = await auth();
  const user = await getUser(session?.userId);
  const profile = await getProfile(params.id);

  if (!profile) {
    notFound();
  }

  const { renames } = profile;

  return (
    <main className="flex min-h-screen flex-row items-start justify-between">
      <Sidebar user={user} navTitle='使用者資料' fixed={false} className={`max-h-screen scrollbar-thin flex flex-col pb-1 z-[410] bg-gradient-to-br from-stone-50 to-slate-200`}>
      </Sidebar>

      <div className='container mx-auto px-1 sm:px-4'>
        <h1 className='w-full text-center sm:text-start font-bold py-3 text-lg'>使用者資料</h1>

        <BasicInfo user={user} profile={profile} />

        <hr className='invisible w-11/12 h-px mx-auto my-5 bg-slate-400/75 border-0' />

        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-x-3 md:gap-x-5'>

          <div className={cardCls}>
            <div className='mb-3 bg-slate-200 flex items-center font-bold'>
              <MapIcon className='mr-2 fill-current opacity-75' height={24} />
              世界地圖貢獻
            </div>
            <div className='flex items-center justify-between gap-x-4'>
              <div className='grid grid-cols-[min-content_2fr] gap-x-2 gap-y-2 w-[clamp(30%,9rem,50%)]'>
                {SpotActionEnum.options.map(action => (
                  <Fragment key={action}>
                    <div className='whitespace-nowrap'><ActionLabel action={action} className='py-1' /></div>
                    <div className='font-mono text-right'>
                      {
                        profile.actionCounts[action] || 0
                      }
                    </div>
                  </Fragment>
                ))}
              </div>

              <div className='flex items-center justify-center w-1/2'>
                <div className='p-4 mx-5 sm:mx-16 aspect-square flex items-center justify-center min-w-16 rounded-full bg-slate-100 ring-2 ring-offset-4 ring-offset-stone-200 text-lg font-mono shadow-lg'>
                  {
                    R.sum(R.values(profile.actionCounts))
                  }
                </div>
              </div>
            </div>
          </div>

          <div className={cardCls}>
            <div className='mb-3 bg-slate-200 flex items-center font-bold'>
              <PencilIcon className='mr-2 stroke-current opacity-75' height={24} />
              改名備份
              {renames ? <span className='font-mono font-normal ml-2 text-slate-600'>({renames.length - 1})</span> : '' }
            </div>
            {renames && renames.length > 1 ?
              <ul className='divide-y-2 divide-slate-400/75 max-h-64 overflow-auto scrollbar-thin'>
                <li className='flex items-center justify-center py-1'>
                  <span className='pr-2 text-slate-600'>{profile.name}</span>
                  <span className='font-mono text-xs ml-auto whitespace-nowrap text-slate-600'>現在值</span>
                </li>
                {renames.map((r, idx) => {
                  if (!r) return null;
                  const date = format({}, 'yyyy/MM/dd HH:mm', r.time);
                  return (
                    <li key={idx} className='flex items-center justify-center py-1'>
                      <span className={`pr-2`}>{r.content}</span>
                      <time className='font-mono text-xs ml-auto whitespace-nowrap'>{ date }</time>
                    </li>
                  );
                })}
              </ul>
              :
              <div className='flex items-center'>
                <TrophyIcon className='mr-2 fill-yellow-600 opacity-75' height={24} />
                從來沒有變更過。
              </div>
            }
          </div>
        </div>

      </div>
    </main>
  );
}
