/* eslint-disable ds/container-widths-only-at, ds/no-hardcoded-copy -- BRIK-3 prime DS rules deferred */
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function ErrorPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted p-4">
      <div className="mx-auto max-w-md text-center">
        <AlertCircle className="mx-auto mb-4 h-16 w-16 text-danger" />
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Something went wrong
        </h1>
        <p className="mb-8 text-muted-foreground">
          We encountered an error. Please try again.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}
