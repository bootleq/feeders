import dynamic from 'next/dynamic'

const LazyMap = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

const TW_CENTER = [23.9739, 120.9773];

export default function Page() {
  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-between">
        <LazyMap preferCanvas={true} zoom={8} center={TW_CENTER}></LazyMap>
      </main>
    </>
  );
}
