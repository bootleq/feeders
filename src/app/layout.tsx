import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Provider } from 'jotai';
import { SessionProvider } from 'next-auth/react';
import NextTopLoader from 'nextjs-toploader';
import "./globals.css";
import { SITE_NAME, APP_URL } from '@/lib/utils';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: `%s - ${SITE_NAME}`,
    default: SITE_NAME,
  },
  description: '遊蕩犬餵食問題與對策',
  metadataBase: new URL(APP_URL),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <NextTopLoader color='#000' crawlSpeed={400} showForHashAnchor={false} />
        <Provider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </Provider>
      </body>
    </html>
  );
}
