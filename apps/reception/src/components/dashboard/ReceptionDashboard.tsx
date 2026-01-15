"use client";

import { useMemo } from "react";
import { CalendarCheck, CalendarClock, CalendarX } from "lucide-react";
import { Grid } from "@acme/ui/components/atoms/primitives";
import { MetricsCard } from "@acme/ui/operations";

import { useAuth } from "../../context/AuthContext";
import useAllFinancialTransactionsData from "../../hooks/data/useAllFinancialTransactionsData";
import { useCheckins } from "../../hooks/data/useCheckins";
import { useCheckouts } from "../../hooks/data/useCheckouts";
import { addDays, formatItalyDate, getLocalToday, getLocalYyyyMmDd } from "../../utils/dateUtils";
import { DashboardMetrics } from "./DashboardMetrics";
import { DashboardQuickActions } from "./DashboardQuickActions";

export default function ReceptionDashboard() {
  const { user } = useAuth();
  const today = getLocalToday();
  const tomorrow = getLocalYyyyMmDd(addDays(new Date(), 1));
  const todayLabel = formatItalyDate(new Date());

  const {
    allFinancialTransactions,
    loading: transactionsLoading,
    error: transactionsError,
  } = useAllFinancialTransactionsData();
  const { checkins, loading: checkinsLoading, error: checkinsError } = useCheckins();
  const { checkouts, loading: checkoutsLoading, error: checkoutsError } = useCheckouts();

  const transactions = useMemo(() => {
    if (!allFinancialTransactions) return [];
    return Object.values(allFinancialTransactions);
  }, [allFinancialTransactions]);

  const arrivalsToday = useMemo(() => {
    return Object.keys(checkins?.[today] ?? {}).length;
  }, [checkins, today]);

  const departuresToday = useMemo(() => {
    return Object.keys(checkouts?.[today] ?? {}).length;
  }, [checkouts, today]);

  const departuresTomorrow = useMemo(() => {
    return Object.keys(checkouts?.[tomorrow] ?? {}).length;
  }, [checkouts, tomorrow]);

  const summaryLoading = checkinsLoading || checkoutsLoading;
  const summaryError = checkinsError || checkoutsError;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-darkAccentGreen">
            Reception Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Today - {todayLabel}
          </p>
        </div>
        {user && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Signed in as{" "}
            <span className="font-medium text-gray-700 dark:text-gray-200">
              {user.displayName || user.email}
            </span>
          </div>
        )}
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Performance
        </h2>
        <DashboardMetrics transactions={transactions} loading={transactionsLoading} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Arrivals and Departures
        </h2>
        <Grid cols={1} gap={4} className="md:grid-cols-3">
          <MetricsCard
            label="Arrivals Today"
            value={summaryLoading ? "-" : arrivalsToday.toString()}
            icon={CalendarCheck}
            description={summaryLoading ? "Loading" : "Check-ins"}
          />
          <MetricsCard
            label="Departures Today"
            value={summaryLoading ? "-" : departuresToday.toString()}
            icon={CalendarX}
            variant={departuresToday > 0 ? "warning" : "default"}
            description={summaryLoading ? "Loading" : "Check-outs"}
          />
          <MetricsCard
            label="Departures Tomorrow"
            value={summaryLoading ? "-" : departuresTomorrow.toString()}
            icon={CalendarClock}
            variant={departuresTomorrow > 0 ? "success" : "default"}
            description={summaryLoading ? "Loading" : "Scheduled"}
          />
        </Grid>
      </section>

      <DashboardQuickActions />

      {Boolean(summaryError || transactionsError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
          There was an error loading dashboard data. Some metrics may be stale.
        </div>
      )}
    </div>
  );
}