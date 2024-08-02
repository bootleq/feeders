"use client"

import * as R from 'ramda';
import { useSession, signIn, signOut } from 'next-auth/react';

type UserProps = {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
};

function SignIn() {
  return <button onClick={() => signIn()}>登入</button>;
}

function SignOut() {
  return <button onClick={() => signOut()}>登出</button>;
}

export default function User({ children, className, ...rest }: UserProps) {
  const session = useSession();

  return (
    <div className="z-10 w-full items-center justify-between text-sm lg:flex">
      { session ? <SignOut /> : <SignIn /> }
    </div>
  );
}
