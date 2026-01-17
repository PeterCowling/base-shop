'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Status = 'loading' | 'ready' | 'error' | 'verified';

export default function GuestEntryPage() {
  const searchParams = useSearchParams();
  const token = useMemo(() => {
    return searchParams.get('token') || searchParams.get('t') || '';
  }, [searchParams]);

  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [lastName, setLastName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [guestFirstName, setGuestFirstName] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Missing or invalid link.');
      setStatus('error');
      return;
    }

    let isMounted = true;

    async function validateToken() {
      try {
        const response = await fetch(`/api/guest-session?token=${encodeURIComponent(token)}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('This link is no longer valid.');
          }
          if (response.status === 410) {
            throw new Error('This link has expired.');
          }
          throw new Error('Unable to validate this link.');
        }

        if (isMounted) {
          setStatus('ready');
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to validate this link.');
          setStatus('error');
        }
      }
    }

    validateToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    if (!lastName.trim() || !token) return;

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/guest-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, lastName: lastName.trim() }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('That last name does not match our booking.');
        }
        if (response.status === 429) {
          throw new Error('Too many attempts. Please try again later.');
        }
        throw new Error('Verification failed. Please try again.');
      }

      const data = await response.json() as {
        bookingId: string;
        guestUuid: string | null;
        guestFirstName: string;
      };

      localStorage.setItem('prime_guest_token', token);
      localStorage.setItem('prime_guest_booking_id', data.bookingId);
      if (data.guestUuid) {
        localStorage.setItem('prime_guest_uuid', data.guestUuid);
      }
      if (data.guestFirstName) {
        localStorage.setItem('prime_guest_first_name', data.guestFirstName);
      }
      localStorage.setItem('prime_guest_verified_at', new Date().toISOString());

      setGuestFirstName(data.guestFirstName || '');
      setStatus('verified');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  }

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-md rounded-xl bg-white p-6 text-center shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Link problem</h1>
          <p className="mb-6 text-gray-600">{error}</p>
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

  if (status === 'verified') {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-md rounded-xl bg-white p-6 text-center shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            {guestFirstName ? `Welcome, ${guestFirstName}` : 'You\'re in'}
          </h1>
          <p className="mb-6 text-gray-600">
            Your portal is ready. We\'ll guide you through arrival prep next.
          </p>
          <Link
            href="/portal"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            Continue
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Confirm your stay</h1>
          <p className="mt-2 text-gray-600">
            Please enter the last name on the booking to continue.
          </p>
        </div>

        <form onSubmit={handleVerify} className="rounded-xl bg-white p-6 shadow-sm">
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last name
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Enter your last name"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            disabled={isVerifying}
          />

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying || !lastName.trim()}
            className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isVerifying ? 'Checking...' : 'Continue'}
          </button>
        </form>
      </div>
    </main>
  );
}
