'use client';

import dynamic from 'next/dynamic';

const StaffLookupClient = dynamic(() => import('./StaffLookupClient'), { ssr: false });

export default function StaffLookupPage() {
  return <StaffLookupClient />;
}
