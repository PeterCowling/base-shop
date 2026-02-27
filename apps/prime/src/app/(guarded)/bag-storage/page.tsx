/* eslint-disable ds/no-hardcoded-copy -- BRIK-2 bag-storage i18n deferred */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';

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
      <main className="flex min-h-dvh items-center justify-center bg-muted p-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    );
  }

  if (!snapshot) {
    return (
      <main className="min-h-dvh bg-muted p-4">
        <div className="mx-auto w-full rounded-xl bg-card p-6 text-center shadow-sm">
          <h1 className="mb-2 text-xl font-semibold text-foreground">Bag Storage</h1>
          <p className="text-sm text-muted-foreground">We could not load bag-storage details right now.</p>
          <Link href="/" className="mt-5 inline-block text-primary hover:underline">
            Return Home
          </Link>
        </div>
      </main>
    );
  }

  const isCheckedOut = snapshot.arrivalState === 'checked-out';
  const activeRequestStatus = snapshot.bagStorage?.requestStatus ?? snapshot.requestSummary?.bag_drop?.status ?? null;

  return (
    <main className="min-h-dvh bg-muted p-4 pb-20">
      <div className="mx-auto w-full space-y-4">
        <div className="rounded-xl bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <Package className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">Bag Storage</h1>
              <p className="text-xs text-muted-foreground">Post-checkout bag-drop requests</p>
            </div>
          </div>

          {activeRequestStatus && (
            <p className="mb-3 rounded-lg bg-info-soft px-3 py-2 text-xs text-info-foreground">
              Current request status: <span className="font-semibold">{activeRequestStatus}</span>
            </p>
          )}

          {!isCheckedOut ? (
            <p className="text-sm text-muted-foreground">
              Bag-drop requests become available after checkout. Please return once your stay is checked out.
            </p>
          ) : (
            <form onSubmit={submitBagDrop}>
              <label htmlFor="pickupWindow" className="text-xs font-medium text-muted-foreground">
                Pickup window
              </label>
              <select
                id="pickupWindow"
                value={pickupWindow}
                onChange={(event) => setPickupWindow(event.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                required
              >
                <option value="" disabled>Select a time slot…</option>
                {[
                  '07:30 – 08:00', '08:00 – 08:30', '08:30 – 09:00',
                  '09:00 – 09:30', '09:30 – 10:00', '10:00 – 10:30',
                  '10:30 – 11:00', '11:00 – 11:30', '11:30 – 12:00',
                  '12:00 – 12:30', '12:30 – 13:00', '13:00 – 13:30',
                  '13:30 – 14:00', '14:00 – 14:30', '14:30 – 15:00',
                  '15:00 – 15:30',
                ].map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Bags can be collected any time up to 15:30. After that, uncollected bags are handed to our local porter service — there is a <span className="font-medium text-foreground">€15 per bag</span> collection fee.
              </p>

              <label htmlFor="bagNote" className="mt-3 block text-xs font-medium text-muted-foreground">
                Note (optional)
              </label>
              <textarea
                id="bagNote"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                maxLength={500}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              />

              {message && (
                <p className="mt-3 rounded-lg bg-success-soft px-3 py-2 text-xs text-success-foreground">
                  {message}
                </p>
              )}
              {error && (
                <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger-foreground">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !pickupWindow.trim()}
                className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting…' : 'Request bag drop'}
              </button>
            </form>
          )}
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}
