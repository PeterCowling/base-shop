'use client';

import { Package } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useGuestBookingSnapshot } from '../../../hooks/dataOrchestrator/useGuestBookingSnapshot';
import { GUEST_CRITICAL_FLOW_ENDPOINTS } from '../../../lib/security/guestCriticalFlowEndpoints';

export default function BagStoragePage() {
  const { snapshot, token, isLoading, refetch } = useGuestBookingSnapshot();
  const [pickupWindow, setPickupWindow] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitBagDrop(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !pickupWindow) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(GUEST_CRITICAL_FLOW_ENDPOINTS.bag_drop, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          pickupWindow,
          note,
        }),
      });
      const payload = await response.json() as { message?: string; error?: string; deduplicated?: boolean };
      if (!response.ok) {
        setError(payload.error ?? 'Unable to submit bag-drop request.');
        return;
      }
      setMessage(payload.message ?? (payload.deduplicated
        ? 'An active bag-drop request already exists.'
        : 'Bag-drop request submitted.'));
      setNote('');
      await refetch();
    } catch {
      setError('Unable to submit bag-drop request right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </main>
    );
  }

  if (!snapshot) {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-md rounded-xl bg-white p-6 text-center shadow-sm">
          <h1 className="mb-2 text-xl font-semibold text-gray-900">Bag Storage</h1>
          <p className="text-sm text-gray-600">We could not load bag-storage details right now.</p>
          <Link href="/" className="mt-5 inline-block text-blue-600 hover:underline">
            Return Home
          </Link>
        </div>
      </main>
    );
  }

  const isCheckedOut = snapshot.arrivalState === 'checked-out';
  const activeRequestStatus = snapshot.bagStorage?.requestStatus ?? snapshot.requestSummary?.bag_drop?.status ?? null;

  return (
    <main className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <Package className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Bag Storage</h1>
              <p className="text-xs text-gray-500">Post-checkout bag-drop requests</p>
            </div>
          </div>

          {activeRequestStatus && (
            <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
              Current request status: <span className="font-semibold">{activeRequestStatus}</span>
            </p>
          )}

          {!isCheckedOut ? (
            <p className="text-sm text-gray-600">
              Bag-drop requests become available after checkout. Please return once your stay is checked out.
            </p>
          ) : (
            <form onSubmit={submitBagDrop}>
              <label htmlFor="pickupWindow" className="text-xs font-medium text-gray-600">
                Pickup window
              </label>
              <input
                id="pickupWindow"
                value={pickupWindow}
                onChange={(event) => setPickupWindow(event.target.value)}
                placeholder="e.g. 16:00 - 18:00"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
              />

              <label htmlFor="bagNote" className="mt-3 block text-xs font-medium text-gray-600">
                Note (optional)
              </label>
              <textarea
                id="bagNote"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                maxLength={500}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />

              {message && (
                <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  {message}
                </p>
              )}
              {error && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !pickupWindow.trim()}
                className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting…' : 'Request bag drop'}
              </button>
            </form>
          )}
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}
