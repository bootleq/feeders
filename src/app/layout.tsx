import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Provider } from 'jotai';
import { SessionProvider } from 'next-auth/react';
import "./globals.css";
import { SITE_NAME } from '@/lib/utils';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: `%s - ${SITE_NAME}`,
    default: SITE_NAME,
  },
  description: '遊蕩犬餵食問題與對策',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <Provider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </Provider>
      </body>
    </html>
  );
}
