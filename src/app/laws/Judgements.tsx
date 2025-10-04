"use client"

import { useSearchParams } from 'next/navigation';
import Html from '@/components/Html';
import styles from './laws.module.scss';

export default function Judgements({ judgements }: {
  judgements: any,
}) {
  const searchParams = useSearchParams();
  const openJudges = searchParams.has('judge') ? !!searchParams.get('judge') : false;

  if (!judgements) {
    return;
  }

  return (
    <details className={`ml-2 clear-both break-words ${styles.judgements}`} open={openJudges}>
      <summary className='flex items-center cursor-pointer text-red-900/80'>
        <img src='/assets/gavel.svg' alt='法槌' width={20} height={20} className='-scale-x-100' />
        案例
      </summary>
      <Html html={judgements} className='p-1 mb-2 text-sm' />
    </details>
  );
}
