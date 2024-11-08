"use client"

import Sitemap from '@/components/Sitemap';
import { useSession } from 'next-auth/react';

export default function HomeNav() {
  const { data: session, status } = useSession();

  const userDisplay = status === 'loading' ? '' : (status === 'authenticated' ? (session?.user?.name || '我') : '登入');
  const userLink = status === 'authenticated' ? `/user/${session.userId}` : '/user/login';

  return (
    <Sitemap
      className='mt-16 md:mt-auto'
      userDisplay={userDisplay}
      userLink={userLink}
    />
  );
}
