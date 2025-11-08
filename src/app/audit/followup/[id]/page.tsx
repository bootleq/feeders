import * as R from 'ramda';
import type { Metadata } from "next";
import { Fragment } from 'react';
import Link from 'next/link';
import { t } from '@/lib/i18n';
import ClientDate from '@/components/ClientDate';
import { format, formatISO } from '@/lib/date-fp';
import { UserIcon } from '@heroicons/react/24/outline';

import { getDb } from '@/lib/db';
import {
  spotFollowups,
  users,
  changes,
  PubStateEnum,
} from '@/lib/schema';
import {
  eq,
  and,
  inArray,
  asc,
  getTableName,
} from 'drizzle-orm';

export const dynamic = 'force-static';

async function getItems(id: string) {
  const db = getDb();
  const items = await db.select({
    id:        changes.id,
    scope:     changes.scope,
    whodunnit: changes.whodunnit,
    content:   changes.content,
    createdAt: changes.createdAt,
    userName: users.name,
  })
    .from(changes)
    .innerJoin(spotFollowups, eq(spotFollowups.id, changes.docId))
    .leftJoin(users, eq(users.id, changes.whodunnit))
    .where(and(
      eq(spotFollowups.state, PubStateEnum.enum.published),
      eq(changes.docType, getTableName(spotFollowups)),
      eq(changes.docId, id),
      inArray(changes.scope, ['amendFollowup']),
    )).orderBy(
      asc(changes.createdAt)
    );

  return items;
}

function contentValueCls(key: string) {
  switch (key) {
    case 'desc':
      return 'whitespace-pre-wrap';
    case 'removedAt':
    case 'spawnedAt':
      return 'font-mono';

    default:
      return '';
  }
}

function renderValue(value: any) {
  if (value instanceof Date) {
    return (
      <ClientDate fallback={<span className='opacity-50'>----/--/-- --:--</span>}>
        {format({}, 'yyyy/MM/dd HH:mm', value)}
      </ClientDate>
    );
  }

  return value;
}

type Changeset = {
  action?: string,
  desc?: string,
  material?: string,
  feedeeCount?: number,
  spawnedAt?: Date,
  removedAt?: Date,
}

function FallbackTime() {
  return (
    <time className='font-mono bg-purple-800/75 text-slate-100 px-2 align-text-bottom'>
      <span className='opacity-50'>
        ----/--/-- --:--
      </span>
    </time>
  );
}

function Entry({ item }: {
  item: {
    id: number,
    scope: string,
    content: unknown,
    createdAt: Date,
    whodunnit: string,
    userName: string | null,
  }
}) {
  const { id, scope, createdAt, whodunnit, userName } = item;
  const content = item.content as Changeset;
  const createdAtISO = formatISO({ representation: 'complete' }, createdAt);
  const createdAtString = format({}, 'yyyy/MM/dd HH:mm', createdAt);

  return (
    <li className='my-2 px-1 sm:px-4 pt-2 pb-3 ring-1 bg-slate-200 rounded-lg shadow-lg marker:text-2xl marker:text-slate-400'>
      <div className='inline-flex items-center gap-x-2 text-slate-600'>
        <div className=''>
          {t('changeScope', scope)}
        </div>

        <Link href={`#${id}`}>
          <ClientDate fallback={<FallbackTime />}>
            <time dateTime={createdAtISO} className='font-mono bg-purple-800/75 text-slate-100 px-2 align-text-bottom'>
              {createdAtString}
            </time>
          </ClientDate>
        </Link>

        <Link href={`/user/${whodunnit}`} className='flex items-center'>
          <UserIcon className='mr-1 size-4 rounded-full' height={20} />
          {userName}
        </Link>
      </div>

      <hr className='invisible w-11/12 h-px mx-auto my-2 bg-slate-400/75 border-0' />

      <div className='grid grid-cols-[auto_2fr] gap-y-2 gap-x-2 my-2 items-start justify-center'>
        {Object.entries(content).map(([k, v]) => {
          return (
            <Fragment key={k}>
              <div className='whitespace-nowrap pr-2'>
                {t('spotFields', k)}
              </div>
              <div className={contentValueCls(k)}>
                {renderValue(v)}
              </div>
            </Fragment>
          );
        })
        }
      </div>
    </li>
  );
}

export const metadata: Metadata = {
  title: '地點跟進記錄',
  description: '世界地圖中每個地點的「跟進」項目，每次修改的變更歷史',
};

export default async function Page({ params }: {
  params: {
    id: string
  }
}) {
  console.log({ '💀 cache thru': 'audit followup', args: [params.id] });
  const items = await getItems(params.id);

  return (
    <main className="flex min-h-screen flex-row items-start justify-between">
      <div className='container mx-auto px-1 sm:px-4'>
        <h1 className='flex items-center w-full text-center sm:text-start font-bold py-3 text-lg'>
          舊版本記錄
          {
            items.length ?
              <span className='font-normal font-mono mx-2'>
                ({items.length})
              </span>
              :
              <span className='font-normal mx-2'>
                （無記錄，或受網站管理處分不公開）
              </span>
          }
        </h1>

        <ol className='list-decimal list-inside flex flex-col-reverse px-1 sm:px-2 gap-y-2 mb-10'>
          {items.map(item => {
            return (
              <Entry key={item.id} item={item} />
            );
          })}
        </ol>
      </div>
    </main>
  );
}
