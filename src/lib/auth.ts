import NextAuth, { type DefaultSession } from "next-auth";
import type { AuthConfig, User } from '@auth/core/types';
import type { AdapterUser } from "@auth/core/adapters"

import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

import { users, accounts, sessions, verificationTokens } from '@/lib/schema';
import { getDb } from '@/lib/db';
import * as R from 'ramda';

// https://authjs.dev/getting-started/typescript#module-augmentation
declare module "next-auth" {
  interface Session {
    userId: string,
    user: {
      state?: string
    } & DefaultSession["user"]
  }

  interface User {
    state?: string
  }
}

const providers = [
  GoogleProvider({
    authorization: {
      params: {
        // Try remove "openid profile" from default. However even only request
        // "email", consent screen still ask for profile.
        scope: 'email',
        prompt: 'select_account',
      }
    },

    async profile(profile) {
      // We only use email + random id. However `sub` is still needed to set
      // as `id` for Auth.js' Account record.
      // Eventually orm will set user id to nanoid by its `$defaultFn`.
      // ref: https://github.com/nextauthjs/next-auth/blob/a3d3d4bab3e/packages/core/src/lib/utils/providers.ts#L99
      // ref: https://github.com/nextauthjs/next-auth/blob/a3d3d4bab3e/packages/core/src/lib/actions/callback/oauth/callback.ts#L246
      return {
        id: profile.sub ?? profile.id,
        email: profile.email,
      };
    },
  })
]

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(async (req) => {
  const db = getDb();

  return {
    providers,
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    pages: {
      signIn: '/user/login',
    },
    callbacks: {
      async signIn({ account, profile }) {
        // Only allow users with verified email (Google)
        // ref: https://authjs.dev/reference/core#signin
        if (account?.provider === "google" && profile?.email_verified) {
          return true;
        }
        return false;
      },
      async session({ session, user }) {
        // Only leave wanted props (could also achieve it by custom getSessionAndUser)
        session.user = R.pick(['id', 'name', 'state'] as (keyof AdapterUser)[], user);
        return session;
      },
    },
    session: { strategy: 'database'},
    debug: false,
    // debug: process.env.NODE_ENV === 'development'
  };
})
