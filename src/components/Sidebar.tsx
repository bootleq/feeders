"use client"

import * as R from 'ramda';
import { useHydrateAtoms } from 'jotai/utils';
import Nav from '@/components/Nav';
import { userAtom, navTitleAtom } from '@/components/store';
import type { WorldUserResult } from '@/models/users';

import { Bars3Icon } from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { useEffect, useState, useRef } from 'react';
import { useSetAtom } from 'jotai';

type SidebarProps = {
  user: WorldUserResult | null,
  navTitle?: string,
  fixed?: boolean,
  children?: React.ReactNode;
  className?: string;
};

const toggleBtnBaseCls = 'cursor-pointer absolute insert-0 size-8 fill-current bg-transparent transition delay-200 duration-500';
const widthCls = 'w-[100vw] min-w-[5%] max-w-full sm:w-[35%] sm:max-w-[60%] lg:w-[20%] lg:max-w-[70%]';

export default function Sidebar({ user, navTitle, fixed = true, children, className, ...rest }: SidebarProps) {
  useHydrateAtoms([
    [userAtom, user],
  ]);
  const setNavTitle = useSetAtom(navTitleAtom);
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (navTitle) {
      setNavTitle(navTitle);
    }
  }, [navTitle, setNavTitle]);

  useEffect(() => {
    if (fixed) return;
    const bar = ref.current;

    if (bar) {
      const handler = (e: TransitionEvent) => {
        if (e.target !== bar) return;
        open ? bar.classList.add('sm:relative') : bar.classList.remove('sm:relative');
      };
      bar.removeEventListener('transitionend', handler);
      bar.addEventListener('transitionend', handler);
      return () => bar.removeEventListener('transitionend', handler);
    }
  }, [fixed, open]);

  const toggle = () => setOpen(R.not);
  const fixedCls = fixed ? 'fixed ' : 'fixed sm:relative sm:h-screen';

  return (
    <>
      <div
        ref={ref}
        className={`${fixedCls} ${widthCls} min-h-[10vh] sm:min-h-full resize-x transition duration-200 ${open ? 'md:overflow-hidden' : '-translate-x-full '} ${className}`}
        data-role='sidebar'
        aria-expanded={open}
      >
        {children}

        <Nav user={user} />

        <div className={`absolute top-0 z-[900] min-w-8 min-h-8 -right-8 transition ${open ? '-translate-x-8' : 'translate-x-1 sm:translate-x-4 sm:translate-y-2'}`}>
          <Bars3Icon onClick={toggle} className={`${toggleBtnBaseCls} ${open ? '-scale-x-0' : 'sm:scale-150'} drop-shadow-lg`} height={24} />
          <XMarkIcon onClick={toggle} className={`${toggleBtnBaseCls} ${open ? 'sm:scale-75' : '-scale-x-0'} opacity-30`} height={24} />
        </div>
      </div>
    </>
  );
};
