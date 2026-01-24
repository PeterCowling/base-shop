'use client';

import dynamic from 'next/dynamic';

const HomePage = dynamic(() => import('../../components/homepage/HomePage'), { ssr: false });

/**
 * Guarded Home Page
 *
 * The main authenticated home page for guests.
 * Shows quest progress, social highlights, tasks, and services
 * personalized based on guest intent.
 */
export default function GuardedHomePage() {
  return <HomePage />;
}
