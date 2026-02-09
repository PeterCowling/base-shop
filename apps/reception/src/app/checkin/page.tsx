"use client";

import dynamicImport from 'next/dynamic';

// Dynamically import with ssr: false to prevent prerendering
// This avoids SSR issues with localStorage in DarkModeContext
const CheckinContent = dynamicImport(
  () => import('@/components/checkins/CheckinContent'),
  { ssr: false }
);

export default function CheckinPage() {
  return <CheckinContent />;
}
