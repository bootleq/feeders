import dynamic from 'next/dynamic';
import * as R from 'ramda';
import { eq, desc, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { spots as spotsSchema } from '@/lib/schema';
import { db } from '@/lib/db';
import { formatISO } from '@/lib/date-fp';
import { MapPinIcon } from '@heroicons/react/24/solid';

export const runtime = 'edge';

type SelectSpot = typeof spotsSchema.$inferSelect;

const LazyMap = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

const TW_CENTER = [23.9739, 120.9773];
const fetchLimit = 200;

async function getSpots() {
  const items = await db.query.spots.findMany({
    columns: {
      id: true,
      title: true,
      lat: true,
      lon: true,
      desc: true,
      state: true,
      createdAt: true,
      userId: true,
    },
    where: eq(spotsSchema.state, 'published'),
    orderBy: [desc(spotsSchema.createdAt)],
    limit: fetchLimit + 1
  });

  return items;
}

const spotsByDay = (spots: SelectSpot[]) => {
  return R.groupBy(s => s.createdAt.toISOString(), spots);
}

function RecentSpots({ spots }: { spots: SelectSpot[] }) {
  if (!spots.length) {
    return <p>沒有發現報告</p>;
  }

  const byDate = R.pipe(
    R.groupBy(
      R.pipe(R.prop('createdAt'), formatISO({ representation: 'date' }))
    ),
    Object.entries
  )(spots);

  const list = byDate.map(([date, items]) => {
    return (
      <li key={date}>
        <time dateTime={`${date}`}>{date}</time>
        <ul className='flex flex-row'>
          {items.map((i: SelectSpot) => (
          <li key={i.id}>
            <MapPinIcon className='fill-current' height={24} />
          </li>
        ))}
        </ul>
      </li>
    );
  });

  return <ul>{list}</ul>
}

export default async function Page() {
  const spots = await getSpots();

  return (
    <main className="flex min-h-screen flex-row items-start justify-between">
      <div className='flex flex-col px-3 py-1'>
        <h2>HOME</h2>

        <RecentSpots spots={spots} />

      </div>
      <LazyMap preferCanvas={true} zoom={8} center={TW_CENTER}></LazyMap>
    </main>
  );
}
