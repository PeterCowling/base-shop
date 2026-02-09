'use client';

import { type ReactNode } from 'react';

import { PinAuthProvider } from '../contexts/messaging/PinAuthProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PinAuthProvider>
      {children}
    </PinAuthProvider>
  );
}
