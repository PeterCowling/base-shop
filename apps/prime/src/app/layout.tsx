import '../styles/globals.css';

import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';

import ServiceWorkerProvider from '../components/pwa/ServiceWorkerProvider';
import { QueryProvider } from '../providers/QueryProvider';

import { Providers } from './providers';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plus-jakarta-sans',
});

/* eslint-disable ds/no-hardcoded-copy -- BRIK-002 Next.js metadata export (non-UI head tags) */
export const metadata: Metadata = {
  title: 'Prime Guest Portal',
  description: 'Guest check-in and services portal',
  manifest: '/manifest.webmanifest',
};
/* eslint-enable ds/no-hardcoded-copy */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body>
        <QueryProvider>
          <Providers>
            <ServiceWorkerProvider>{children}</ServiceWorkerProvider>
          </Providers>
        </QueryProvider>
      </body>
    </html>
  );
}
