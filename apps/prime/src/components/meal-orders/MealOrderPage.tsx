'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, UtensilsCrossed } from 'lucide-react';

import { useGuestBookingSnapshot } from '../../hooks/dataOrchestrator/useGuestBookingSnapshot';
import { GUEST_CRITICAL_FLOW_ENDPOINTS } from '../../lib/security/guestCriticalFlowEndpoints';

type MealService = 'breakfast' | 'drink';

interface MealOrderPageProps {
  service: MealService;
  title: string;
  iconClassName?: string;
}

interface ExistingOrderView {
  nightKey: string;
  serviceDate: string;
  value: string;
}

function getRomeTodayIso(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function listServiceDates(checkInDate: string, checkOutDate: string): string[] {
  const start = new Date(`${checkInDate}T00:00:00`);
  const end = new Date(`${checkOutDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return [checkInDate];
  }

  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor < end) {
    const iso = cursor.toISOString().slice(0, 10);
    dates.push(iso);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function hasMealEntitlement(
  service: MealService,
  preorders: Record<string, { breakfast: string; drink1: string; drink2: string }>,
): boolean {
  const nights = Object.values(preorders);
  if (nights.length === 0) {
    return false;
  }
  if (service === 'breakfast') {
    return nights.some((night) => night.breakfast !== 'NA');
  }
  return nights.some((night) => night.drink1 !== 'NA' || night.drink2 !== 'NA');
}

export default function MealOrderPage({
  service,
  title,
  iconClassName = 'text-amber-500',
}: MealOrderPageProps) {
  const { snapshot, token, isLoading, refetch } = useGuestBookingSnapshot();
  const [serviceDate, setServiceDate] = useState('');
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingExceptionPayload, setPendingExceptionPayload] = useState<{
    serviceDate: string;
    value: string;
  } | null>(null);

  const existingOrders = useMemo<ExistingOrderView[]>(() => {
    if (!snapshot) {
      return [];
    }
    return Object.entries(snapshot.preorders)
      .map(([nightKey, night]) => {
        const orderValue = service === 'breakfast' ? night.breakfast : night.drink1;
        return {
          nightKey,
          serviceDate: night.serviceDate ?? night.night,
          value: orderValue,
        };
      })
      .filter((entry) => entry.value && entry.value !== 'NA')
      .sort((a, b) => a.serviceDate.localeCompare(b.serviceDate));
  }, [service, snapshot]);

  const availableDates = useMemo(() => {
    if (!snapshot) {
      return [];
    }
    const base = listServiceDates(snapshot.checkInDate, snapshot.checkOutDate);
    const fromOrders = existingOrders.map((order) => order.serviceDate);
    return [...new Set([...base, ...fromOrders])].sort();
  }, [existingOrders, snapshot]);

  const eligible = useMemo(() => {
    if (!snapshot) {
      return false;
    }
    return hasMealEntitlement(service, snapshot.preorders);
  }, [service, snapshot]);

  async function submitOrder(requestChangeException = false) {
    if (!token || !serviceDate || !value) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(GUEST_CRITICAL_FLOW_ENDPOINTS.meal_orders, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          service,
          serviceDate,
          value,
          requestChangeException,
        }),
      });

      const payload = await response.json() as {
        success?: boolean;
        policyBlocked?: boolean;
        requestQueued?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok && !payload.policyBlocked) {
        setError(payload.error ?? 'Unable to update order.');
        return;
      }

      if (payload.policyBlocked && !payload.requestQueued) {
        setError('Same-day changes are blocked. You can request a reception override.');
        setPendingExceptionPayload({ serviceDate, value });
        return;
      }

      if (payload.requestQueued) {
        setMessage(payload.message ?? 'Reception override request submitted.');
        setPendingExceptionPayload(null);
      } else {
        setMessage(payload.message ?? 'Order saved.');
        setPendingExceptionPayload(null);
      }
      setValue('');
      await refetch();
    } catch {
      setError('Unable to update order right now.');
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
          <h1 className="mb-2 text-xl font-semibold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-600">We could not load your meal order data right now.</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Return Home
          </Link>
        </div>
      </main>
    );
  }

  if (!eligible) {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-md rounded-xl bg-white p-6 text-center shadow-sm">
          <UtensilsCrossed className={`mx-auto mb-4 h-12 w-12 ${iconClassName}`} />
          <h1 className="mb-2 text-xl font-semibold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-600">
            This service is not included in your booking. You can still explore the menu at reception.
          </p>
          <Link href="/" className="mt-5 inline-block text-blue-600 hover:underline">
            Return Home
          </Link>
        </div>
      </main>
    );
  }

  const today = getRomeTodayIso();

  return (
    <main className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <UtensilsCrossed className={`h-6 w-6 ${iconClassName}`} />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              <p className="text-xs text-gray-500">Create or edit your order</p>
            </div>
          </div>

          <label htmlFor="service-date" className="text-xs font-medium text-gray-600">
            Service date
          </label>
          <select
            id="service-date"
            value={serviceDate}
            onChange={(event) => setServiceDate(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Select date</option>
            {availableDates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>

          <label htmlFor="service-value" className="mt-3 block text-xs font-medium text-gray-600">
            Order details
          </label>
          <input
            id="service-value"
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={service === 'breakfast' ? 'e.g. Continental' : 'e.g. Spritz'}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />

          {serviceDate && serviceDate <= today && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Same-day changes are blocked by policy. You can submit an exception request.
            </p>
          )}

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
            type="button"
            onClick={() => void submitOrder(false)}
            disabled={isSubmitting || !serviceDate || !value.trim()}
            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Saving…' : 'Save order'}
          </button>

          {pendingExceptionPayload && (
            <button
              type="button"
              onClick={() => void submitOrder(true)}
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-100"
            >
              Request same-day exception
            </button>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            Existing orders
          </h2>
          {existingOrders.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No orders yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {existingOrders.map((order) => (
                <li key={order.nightKey} className="rounded-lg border border-gray-200 px-3 py-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      <CalendarDays className="h-4 w-4" />
                      {order.serviceDate}
                    </span>
                    <span className="font-medium text-gray-800">{order.value}</span>
                  </div>
                </li>
              ))}
            </ul>
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
