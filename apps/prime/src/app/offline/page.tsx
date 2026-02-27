/* eslint-disable ds/container-widths-only-at, ds/no-hardcoded-copy -- BRIK-3 prime DS rules deferred */
import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted p-4">
      <div className="mx-auto max-w-md text-center">
        <WifiOff className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          You&apos;re offline
        </h1>
        <p className="mb-8 text-muted-foreground">
          Please check your internet connection and try again.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
        >
          Try Again
        </Link>
      </div>
    </main>
  );
}
