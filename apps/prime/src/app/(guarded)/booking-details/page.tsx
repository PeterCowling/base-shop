'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { CalendarDays, Clock3, FileText, MessageCircle, Package, UtensilsCrossed } from 'lucide-react';

import { useGuestBookingSnapshot } from '../../../hooks/dataOrchestrator/useGuestBookingSnapshot';
import { getGuestArrivalState } from '../../../lib/preArrival/arrivalState';
import { GUEST_CRITICAL_FLOW_ENDPOINTS } from '../../../lib/security/guestCriticalFlowEndpoints';
import type { GuestArrivalState } from '../../../types/preArrival';

const EXTENSION_DATE_ID = 'extension-date';
const EXTENSION_NOTE_ID = 'extension-note';

const STATUS_BADGE_CLASS: Record<GuestArrivalState, string> = {
  'pre-arrival': 'bg-info-soft text-info-foreground',
  'arrival-day': 'bg-warning-soft text-warning-foreground',
  'checked-in': 'bg-success-soft text-success-foreground',
  'checked-out': 'bg-muted text-muted-foreground',
};

function formatDate(value: string, fallback: string): string {
  if (!value) {
    return fallback;
  }
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString();
}

export default function BookingDetailsPage() {
  const { t } = useTranslation('BookingDetails');
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
        setExtensionError(payload.error ?? t('extension.errorDefault'));
        return;
      }

      if (payload.deduplicated) {
        setExtensionMessage(t('extension.successDeduplicated'));
      } else {
        setExtensionMessage(
          payload.message ?? t('extension.successDefault'),
        );
      }
      setNote('');
    } catch {
      setExtensionError(t('extension.errorNetwork'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted p-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    );
  }

  if (!snapshot || !arrivalState) {
    return (
      <main className="min-h-screen bg-muted p-4">
        <div className="mx-auto max-w-md rounded-xl bg-card p-6 text-center shadow-sm">
          <h1 className="mb-2 text-xl font-semibold text-foreground">{t('page.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('page.loadError')}</p>
          <Link href="/" className="mt-5 inline-block text-primary hover:underline">
            {t('page.returnHome')}
          </Link>
        </div>
      </main>
    );
  }

  const checkedOut = arrivalState === 'checked-out';
  const showStayActions = arrivalState === 'checked-in' || arrivalState === 'arrival-day';

  return (
    <main className="min-h-screen bg-muted p-4 pb-20">
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-xl bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-foreground">{t('page.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('ref', { code: snapshot.reservationCode })}</p>
            </div>
            <FileText className="h-6 w-6 text-primary" />
          </div>

          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[arrivalState]}`}
          >
            {t(`status.${arrivalState}`)}
          </span>

          <dl className="mt-4 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                {t('dates.checkIn')}
              </dt>
              <dd>{formatDate(snapshot.checkInDate, t('dates.unknown'))}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Clock3 className="h-4 w-4" />
                {t('dates.checkOut')}
              </dt>
              <dd>{formatDate(snapshot.checkOutDate, t('dates.unknown'))}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">{t('room')}</dt>
              <dd>{snapshot.roomAssignment}</dd>
            </div>
          </dl>
        </div>

        {!checkedOut && (
          <form onSubmit={submitExtensionRequest} className="rounded-xl bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t('extension.title')}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('extension.description')}
            </p>
            {snapshot.requestSummary?.extension?.status && (
              <p className="mt-2 rounded-lg bg-info-soft px-3 py-2 text-xs text-info-foreground">
                {t('extension.currentStatus', { status: snapshot.requestSummary.extension.status })}
              </p>
            )}

            <label className="mt-4 block text-xs font-medium text-muted-foreground" htmlFor={EXTENSION_DATE_ID}>
              {t('extension.dateLabel')}
            </label>
            <input
              id={EXTENSION_DATE_ID}
              type="date"
              value={requestedCheckOutDate}
              min={snapshot.checkOutDate}
              onChange={(event) => setRequestedCheckOutDate(event.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              required
            />

            <label className="mt-3 block text-xs font-medium text-muted-foreground" htmlFor={EXTENSION_NOTE_ID}>
              {t('extension.noteLabel')}
            </label>
            <textarea
              id={EXTENSION_NOTE_ID}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              rows={3}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />

            {extensionMessage && (
              <p className="mt-3 rounded-lg bg-success-soft px-3 py-2 text-xs text-success-foreground">
                {extensionMessage}
              </p>
            )}
            {extensionError && (
              <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger-foreground">
                {extensionError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !requestedCheckOutDate}
              className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {isSubmitting ? t('extension.submitting') : t('extension.submitButton')}
            </button>
            <p className="mt-2 text-xs text-muted-foreground">
              {t('extension.replyNote')}
            </p>
          </form>
        )}

        <div className="rounded-xl bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('nextActions.title')}
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-2">
            {showStayActions && (
              <>
                <Link
                  href="/complimentary-breakfast"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                >
                  <UtensilsCrossed className="h-4 w-4 text-warning" />
                  {t('nextActions.breakfast')}
                </Link>
                <Link
                  href="/complimentary-evening-drink"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                >
                  <MessageCircle className="h-4 w-4 text-accent" />
                  {t('nextActions.eveningDrink')}
                </Link>
              </>
            )}

            <Link
              href="/bag-storage"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
            >
              <Package className="h-4 w-4 text-primary" />
              {checkedOut ? t('nextActions.bagDrop') : t('nextActions.bagStorage')}
            </Link>
          </div>
          {checkedOut && (
            <p className="mt-3 text-xs text-muted-foreground">
              {t('nextActions.checkedOutNote')}
            </p>
          )}
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            {t('page.returnHome')}
          </Link>
        </div>
      </div>
    </main>
  );
}
