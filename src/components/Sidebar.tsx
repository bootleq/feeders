"use client"

import * as R from 'ramda';
import { useHydrateAtoms } from 'jotai/utils';
import Nav from '@/components/Nav';
import { userAtom } from '@/components/store';
import type { WorldUserResult } from '@/models/users';

import { Bars3Icon } from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';

type SidebarProps = {
  user: WorldUserResult | null,
  children?: React.ReactNode;
  className?: string;
};

export default function Sidebar({ user, children, className, ...rest }: SidebarProps) {
  useHydrateAtoms([
    [userAtom, user],
  ]);

  const [open, setOpen] = useState(true);

  const toggle = () => setOpen(R.not);

  return (
    <>
      <div className={`fixed w-[100vw] min-w-[5%] max-w-full min-h-[10vh] sm:min-h-full sm:w-[35%] sm:max-w-[60%] lg:w-[20%] lg:max-w-[70%] resize-x transition duration-200 ${open ? 'md:overflow-hidden' : '-translate-x-full '} ${className}`}>
        {children}

        <Nav user={user} />

        <div className={`absolute top-0 z-[900] min-w-8 min-h-8 -right-8 transition ${open ? '-translate-x-8' : 'translate-x-1 sm:translate-x-4 sm:translate-y-2'}`}>
          <Bars3Icon onClick={toggle} className={`cursor-pointer absolute insert-0 size-8 fill-current bg-transparent transition delay-200 duration-500 ${open ? '-scale-x-0' : 'sm:scale-150'} drop-shadow-lg`} height={24} />
          <XMarkIcon onClick={toggle} className={`cursor-pointer absolute insert-0 size-8 fill-current bg-transparent transition delay-200 duration-500 ${open ? 'sm:scale-75' : '-scale-x-0'} opacity-30`} height={24} />
        </div>
      </div>
    </>
  );
};
