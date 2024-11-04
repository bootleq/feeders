"use client"

import { useState, useEffect } from 'react';

export default function ClientDate({ fallback, children }: {
  fallback?: React.ReactNode,
  children?: React.ReactNode,
}) {
  const [effected, setEffected] = useState(false);

  useEffect(() => {
    setEffected(true);
  }, []);

  if (!effected) {
    return fallback || null;
  }

  return (
    <>
      {children}
    </>
  );
}
