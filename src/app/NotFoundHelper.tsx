"use client"

import { usePathname, useSearchParams } from 'next/navigation';

export default function NotFoundHelper() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div>
      <code>
        {pathname}{searchParams.size ? `?${searchParams.toString()}` : ''}
      </code>
    </div>
  );
}
