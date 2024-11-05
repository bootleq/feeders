"use client"

import { useState, useEffect } from 'react';
import useClientOnly from '@/lib/useClientOnly';

export default function ClientDate({ fallback, children }: {
  fallback?: React.ReactNode,
  children?: React.ReactNode,
}) {
  const inClient = useClientOnly();

  if (!inClient) {
    return fallback || null;
  }

  return (
    <>
      {children}
    </>
  );
}
