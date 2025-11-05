import { useAtomValue } from 'jotai';
import { loadingPicksAtom } from './store';
import Spinner from '@/assets/spinner.svg';

export default function LoadingIndicator() {
  const loading = useAtomValue(loadingPicksAtom);
  if (!loading) return;

  return (
    <div className='flex items-center justify-center gap-2 w-full min-h-40 text-fuchsia-950'>
      <Spinner className='' aria-label='讀取中' />
      <p>
        讀取中
      </p>
    </div>
  );
}
