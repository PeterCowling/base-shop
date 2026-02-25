'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

interface GuardedInfoPageShellProps {
  title: string;
  loadErrorMessage: string;
  returnHomeLabel: string;
  isLoading: boolean;
  hasError: boolean;
  children: ReactNode;
}

export default function GuardedInfoPageShell({
  title,
  loadErrorMessage,
  returnHomeLabel,
  isLoading,
  hasError,
  children,
}: GuardedInfoPageShellProps) {
  if (isLoading) {
    return (
      <main className="bg-muted px-4 py-6 pb-24">
        <div className="flex items-center justify-center py-10">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </main>
    );
  }

  if (hasError) {
    return (
      <main className="bg-muted px-4 py-6 pb-24">
        <section className="rounded-xl bg-card p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{loadErrorMessage}</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            {returnHomeLabel}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-muted px-4 py-6 pb-24">
      <div className="space-y-4">{children}</div>
    </main>
  );
}
