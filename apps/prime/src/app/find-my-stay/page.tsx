'use client';

import { ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function FindMyStayPage() {
  const [surname, setSurname] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!surname.trim() || !bookingRef.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/find-booking?surname=${encodeURIComponent(surname)}&bookingRef=${encodeURIComponent(bookingRef)}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError('Booking not found. Please check your details.');
        } else if (response.status === 429) {
          setError('Too many attempts. Please try again later.');
        } else {
          setError('Something went wrong. Please try again.');
        }
        return;
      }

      const data = await response.json();
      if (!data.redirectUrl || typeof data.redirectUrl !== 'string') {
        setError('We found your booking, but could not open your guest link. Please try again.');
        return;
      }

      window.location.assign(data.redirectUrl);
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/"
            className="rounded-full p-2 hover:bg-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Find My Stay</h1>
            <p className="text-sm text-gray-500">Enter your booking details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="surname" className="block text-sm font-medium text-gray-700">
              Surname
            </label>
            <input
              id="surname"
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              placeholder="Enter your surname"
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="bookingRef" className="block text-sm font-medium text-gray-700">
              Booking Reference
            </label>
            <input
              id="bookingRef"
              type="text"
              value={bookingRef}
              onChange={(e) => setBookingRef(e.target.value.toUpperCase())}
              placeholder="e.g. BDC-123456"
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 font-mono uppercase focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !surname.trim() || !bookingRef.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Search className="h-5 w-5" />
                Find Booking
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
