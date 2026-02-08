'use client';

import { CalendarDays, Clock3, FileText, MessageCircle, Package, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { getGuestArrivalState } from '../../../lib/preArrival/arrivalState';
import { useGuestBookingSnapshot } from '../../../hooks/dataOrchestrator/useGuestBookingSnapshot';
import { GUEST_CRITICAL_FLOW_ENDPOINTS } from '../../../lib/security/guestCriticalFlowEndpoints';
import type { GuestArrivalState } from '../../../types/preArrival';

const STATUS_LABELS: Record<GuestArrivalState, string> = {
  'pre-arrival': 'Pre-arrival',
  'arrival-day': 'Arrival day',
  'checked-in': 'Checked in',
  'checked-out': 'Checked out',
};

const STATUS_BADGE_CLASS: Record<GuestArrivalState, string> = {
  'pre-arrival': 'bg-blue-100 text-blue-700',
  'arrival-day': 'bg-amber-100 text-amber-700',
  'checked-in': 'bg-emerald-100 text-emerald-700',
  'checked-out': 'bg-slate-200 text-slate-700',
};

function formatDate(value: string): string {
  if (!value) {
    return 'Unknown';
  }
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString();
}

export default function BookingDetailsPage() {
  const { snapshot, isLoading, token } = useGuestBookingSnapshot();
  const [requestedCheckOutDate, setRequestedCheckOutDate] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extensionMessage, setExtensionMessage] = useState<string | null>(null);
  const [extensionError, setExtensionError] = useState<string | null>(null);

  const arrivalState: GuestArrivalState | null = useMemo(() => {
    if (!snapshot) {
      return null;
    }
    return getGuestArrivalState(
      snapshot.checkInDate,
      snapshot.checkOutDate,
      snapshot.isCheckedIn,
    );
  }, [snapshot]);

  async function submitExtensionRequest(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !requestedCheckOutDate) {
      return;
    }

    setIsSubmitting(true);
    setExtensionError(null);
    setExtensionMessage(null);

    try {
      const response = await fetch(GUEST_CRITICAL_FLOW_ENDPOINTS.extension_request, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          requestedCheckOutDate,
          note,
        }),
      });
      const payload = await response.json() as { message?: string; error?: string; deduplicated?: boolean };
      if (!response.ok) {
        setExtensionError(payload.error ?? 'Unable to submit extension request.');
        return;
      }

      if (payload.deduplicated) {
        setExtensionMessage('This extension request was already submitted recently.');
      } else {
        setExtensionMessage(
          payload.message ?? 'Extension request sent. Reception will respond via email.',
        );
      }
      setNote('');
    } catch {
      setExtensionError('Unable to submit extension request right now.');
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

  if (!snapshot || !arrivalState) {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-md rounded-xl bg-white p-6 text-center shadow-sm">
          <h1 className="mb-2 text-xl font-semibold text-gray-900">Booking Details</h1>
          <p className="text-sm text-gray-600">We could not load your booking details right now.</p>
          <Link href="/" className="mt-5 inline-block text-blue-600 hover:underline">
            Return Home
          </Link>
        </div>
      </main>
    );
  }

  const checkedOut = arrivalState === 'checked-out';
  const showStayActions = arrivalState === 'checked-in' || arrivalState === 'arrival-day';

  return (
    <main className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Booking Details</h1>
              <p className="text-sm text-gray-500">Ref: {snapshot.reservationCode}</p>
            </div>
            <FileText className="h-6 w-6 text-blue-500" />
          </div>

          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[arrivalState]}`}
          >
            {STATUS_LABELS[arrivalState]}
          </span>

          <dl className="mt-4 space-y-3 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-gray-500">
                <CalendarDays className="h-4 w-4" />
                Check-in
              </dt>
              <dd>{formatDate(snapshot.checkInDate)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-gray-500">
                <Clock3 className="h-4 w-4" />
                Check-out
              </dt>
              <dd>{formatDate(snapshot.checkOutDate)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500">Room</dt>
              <dd>{snapshot.roomAssignment}</dd>
            </div>
          </dl>
        </div>

        {!checkedOut && (
          <form onSubmit={submitExtensionRequest} className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
              Request Extension
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Send a stay-extension request to reception.
            </p>
            {snapshot.requestSummary?.extension?.status && (
              <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                Current extension request status: <span className="font-semibold">{snapshot.requestSummary.extension.status}</span>
              </p>
            )}

            <label className="mt-4 block text-xs font-medium text-gray-600" htmlFor="extension-date">
              Requested check-out date
            </label>
            <input
              id="extension-date"
              type="date"
              value={requestedCheckOutDate}
              min={snapshot.checkOutDate}
              onChange={(event) => setRequestedCheckOutDate(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            />

            <label className="mt-3 block text-xs font-medium text-gray-600" htmlFor="extension-note">
              Note (optional)
            </label>
            <textarea
              id="extension-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />

            {extensionMessage && (
              <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {extensionMessage}
              </p>
            )}
            {extensionError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                {extensionError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !requestedCheckOutDate}
              className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Sending request…' : 'Send extension request'}
            </button>
            <p className="mt-2 text-xs text-gray-500">
              Reception replies via email, usually within one business day.
            </p>
          </form>
        )}

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            Next Actions
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-2">
            {showStayActions && (
              <>
                <Link
                  href="/complimentary-breakfast"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <UtensilsCrossed className="h-4 w-4 text-amber-600" />
                  Breakfast order
                </Link>
                <Link
                  href="/complimentary-evening-drink"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <MessageCircle className="h-4 w-4 text-indigo-600" />
                  Evening drink order
                </Link>
              </>
            )}

            <Link
              href="/bag-storage"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Package className="h-4 w-4 text-blue-600" />
              {checkedOut ? 'Request bag drop' : 'Bag storage options'}
            </Link>
          </div>
          {checkedOut && (
            <p className="mt-3 text-xs text-gray-500">
              Your stay is checked out. In-stay services are now hidden; bag-drop and contact options remain available.
            </p>
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
