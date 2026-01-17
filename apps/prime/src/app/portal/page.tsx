'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function GuestPortalPage() {
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('prime_guest_token');
    const storedFirstName = localStorage.getItem('prime_guest_first_name');

    if (!token) {
      setHasSession(false);
      return;
    }

    setHasSession(true);
    setFirstName(storedFirstName || '');
  }, []);

  function handleSignOut() {
    localStorage.removeItem('prime_guest_token');
    localStorage.removeItem('prime_guest_booking_id');
    localStorage.removeItem('prime_guest_uuid');
    localStorage.removeItem('prime_guest_first_name');
    localStorage.removeItem('prime_guest_verified_at');
    setHasSession(false);
  }

  if (hasSession === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </main>
    );
  }

  if (!hasSession) {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-md rounded-xl bg-white p-6 text-center shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Portal unavailable</h1>
          <p className="mb-6 text-gray-600">
            We couldn\'t find an active guest session. Please use your personal link.
          </p>
          <Link
            href="/find-my-stay"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            Find my stay
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md rounded-xl bg-white p-6 text-center shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          {firstName ? `Hi ${firstName}` : 'Welcome back'}
        </h1>
        <p className="mb-6 text-gray-600">
          Your readiness dashboard will appear here next.
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
        >
          Clear session
        </button>
      </div>
    </main>
  );
}
