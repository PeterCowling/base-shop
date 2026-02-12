import '../styles/globals.css';

import type { Metadata } from 'next';

import ServiceWorkerProvider from '../components/pwa/ServiceWorkerProvider';
import { QueryProvider } from '../providers/QueryProvider';

import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Prime Guest Portal',
  description: 'Guest check-in and services portal',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
