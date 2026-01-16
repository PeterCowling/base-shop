'use client';

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
