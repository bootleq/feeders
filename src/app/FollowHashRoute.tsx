"use client"

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function FollowHashRoute() {
  const [latestPath, setLatestPath] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  const onPopState = useCallback((e: PopStateEvent) => {
    const newPathname = new URL(document.location.href).pathname;

    if (newPathname !== latestPath) {
      setLatestPath(newPathname);
      router.replace(document.location.href);
    }
  }, [router, latestPath]);

  useEffect(() => {
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [onPopState]);

  if (pathname !== latestPath) {
    setLatestPath(pathname);
  }

  return null;
}
