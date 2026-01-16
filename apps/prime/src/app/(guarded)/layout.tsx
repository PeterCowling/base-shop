'use client';

import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { usePinAuth } from '../../contexts/messaging/PinAuthProvider';

export default function GuardedLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = usePinAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  if (!user) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
