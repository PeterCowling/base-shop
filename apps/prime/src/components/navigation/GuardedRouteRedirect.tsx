'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface GuardedRouteRedirectProps {
  targetPath: string;
}

export default function GuardedRouteRedirect({
  targetPath,
}: GuardedRouteRedirectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams?.toString() ?? '';

  const destination = useMemo(() => {
    if (!query) {
      return targetPath;
    }

    return `${targetPath}?${query}`;
  }, [query, targetPath]);

  useEffect(() => {
    router.replace(destination);
  }, [destination, router]);

  return (
    <main className="bg-muted px-4 py-6 pb-24">
      <div className="flex items-center justify-center py-10">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    </main>
  );
}
