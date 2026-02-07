'use client';

import dynamic from 'next/dynamic';

const CheckInClient = dynamic(() => import('./CheckInClient'), { ssr: false });

export default function CheckInPage() {
  return <CheckInClient />;
}
