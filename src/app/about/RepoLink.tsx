"use client"

import Link from 'next/link';
import HubIcon from '@/assets/github-mark.svg';

export default function RepoLink() {
  return (
    <Link
      className='flex items-center gap-x-2 p-2 rounded-md w-fit hover:bg-amber-300/50'
      href='https://github.com/bootleq/feeders'
      target='_blank'
      title='bootleq/feeders: Source code of feeders.pages.dev'
    >
      <HubIcon className='w-6 h-6' viewBox='0 0 96 96' />
      github.com/bootleq/feeders
    </Link>
  );
}
