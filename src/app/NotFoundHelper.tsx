"use client"

import { usePathname, useSearchParams } from 'next/navigation';
import useClientOnly from '@/lib/useClientOnly';

export default function NotFoundHelper() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inClient = useClientOnly();

  if (!inClient) {
    return null;
  }

  return (
    <div>
      <code>
        {pathname}{searchParams.size ? `?${searchParams.toString()}` : ''}
      </code>
    </div>
  );
}
