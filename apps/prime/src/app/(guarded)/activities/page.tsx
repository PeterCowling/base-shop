'use client';

import dynamic from 'next/dynamic';

const ActivitiesClient = dynamic(() => import('./ActivitiesClient'), { ssr: false });

export default function ActivitiesPage() {
  return <ActivitiesClient />;
}
