import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Provider } from 'jotai';
import { SessionProvider } from 'next-auth/react';
import ProgressBar from './ProgressBar';
import FollowHashRoute from './FollowHashRoute';
import "./globals.css";
import { SITE_NAME, APP_URL, present } from '@/lib/utils';

if (!APP_URL) {
  throw new Error('Missing APP_URL.');
}

const inter = Inter({ subsets: ["latin"] });

const googleVerificationCode = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFY;

const metadata: Metadata = {
  title: {
    template: `%s - ${SITE_NAME}`,
    default: SITE_NAME,
  },
  description: '遊蕩犬餵食問題與對策',
  metadataBase: new URL(APP_URL),
};

if (present(googleVerificationCode)) {
  metadata.verification = {
    google: googleVerificationCode,
  }
}

export { metadata };

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className='overscroll-none'>
      <body className={inter.className}>
        <ProgressBar />
        <Provider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </Provider>
        <FollowHashRoute />
      </body>
    </html>
  );
}
