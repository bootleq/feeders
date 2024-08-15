import * as R from 'ramda';
import { auth } from '@/lib/auth';
import { Fragment } from 'react';
import { SpotActionEnum } from '@/lib/schema';
import { getWorldUsers, getProfile } from '@/models/users';
import { notFound } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import BasicInfo from './BasicInfo';
import ActionLabel from '@/app/world/[[...path]]/ActionLabel';
import { MapIcon } from '@heroicons/react/24/solid';

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

export default async function Page({ params }: {
  params: { id: string }
}) {
  const session = await auth();
  const user = await getUser(session?.userId);
  const profile = await getProfile(params.id);

  if (!profile) {
    notFound();
  }

  const actionCounts = parseActionCounts(profile.actionCounts);

  return (
    <main className="flex min-h-screen flex-row items-start justify-between">
      <Sidebar user={user} navTitle='使用者資料' fixed={false} className={`max-h-screen scrollbar-thin flex flex-col pb-1 z-[410] bg-gradient-to-br from-stone-50 to-slate-200`}>
      </Sidebar>

      <div className='container mx-auto px-1 sm:px-4'>
        <h1 className='w-full text-center sm:text-start font-bold py-3 text-lg'>使用者資料</h1>

        <BasicInfo user={user} profile={profile} />

        <hr className='invisible w-11/12 h-px mx-auto my-5 bg-slate-400/75 border-0' />

        <div className='grid sm:grid-cols-2 md:grid-cols-3 gap-x-2'>
          <div className='my-2 px-4 pt-3 pb-4 sm:w-min ring-1 bg-slate-200 rounded-lg shadow-lg'>
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
                      { actionCounts[action] }
                    </div>
                  </Fragment>
                ))}
              </div>

              <div className='flex items-center justify-center w-1/2'>
                <div className='p-4 mx-5 sm:mx-16 aspect-square flex items-center justify-center min-w-16 rounded-full bg-slate-100 ring-2 ring-offset-4 ring-offset-stone-200 text-lg font-mono shadow-lg'>
                  {R.sum(R.values(actionCounts))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
