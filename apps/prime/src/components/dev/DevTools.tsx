'use client';

import dynamic from 'next/dynamic';

// Dynamically import dev tools - only loads in development, excluded from production bundle
const FirebaseMetricsPanel = dynamic(
  () => import("./FirebaseMetricsPanel").then(mod => ({ default: mod.FirebaseMetricsPanel })),
  { ssr: false }
);

export function DevTools() {
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev) return null;

  return <FirebaseMetricsPanel />;
}
