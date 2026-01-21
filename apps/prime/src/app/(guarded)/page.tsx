'use client';
// Force dynamic rendering to avoid SSG issues with context providers
export const dynamic = 'force-dynamic';

import HomePage from '../../components/homepage/HomePage';

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
