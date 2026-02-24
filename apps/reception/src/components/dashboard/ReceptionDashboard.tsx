"use client";

import { useMemo } from "react";
import { CalendarCheck, CalendarClock, CalendarX } from "lucide-react";

import { Grid } from "@acme/design-system/primitives";
import { OwnerKpiTile, StaffSignalBadgeGroup } from "@acme/ui";

import { useAuth } from "../../context/AuthContext";
import useAllFinancialTransactionsData from "../../hooks/data/useAllFinancialTransactionsData";
import { useCheckins } from "../../hooks/data/useCheckins";
import { useCheckouts } from "../../hooks/data/useCheckouts";
import { addDays, formatItalyDate, getLocalToday, getLocalYyyyMmDd } from "../../utils/dateUtils";
import { isVoidedTransaction } from "../../utils/transactionUtils";

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
    return Object.values(allFinancialTransactions).filter(
      (txn) => !isVoidedTransaction(txn)
    );
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
          <h1 className="text-2xl font-semibold text-foreground">
            Reception Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Today - {todayLabel}
          </p>
        </div>
        {user && (
          <div className="text-sm text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium text-foreground">
              {user.displayName || user.email}
            </span>
          </div>
        )}
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          Performance
        </h2>
        <DashboardMetrics transactions={transactions} loading={transactionsLoading} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          Arrivals and Departures
        </h2>
        <Grid cols={1} gap={4} className="md:grid-cols-3">
          <OwnerKpiTile
            label="Arrivals Today"
            value={summaryLoading ? "-" : arrivalsToday.toString()}
            icon={CalendarCheck}
            description={summaryLoading ? "Loading" : "Check-ins"}
          />
          <OwnerKpiTile
            label="Departures Today"
            value={summaryLoading ? "-" : departuresToday.toString()}
            icon={CalendarX}
            variant={departuresToday > 0 ? "warning" : "default"}
            description={summaryLoading ? "Loading" : "Check-outs"}
          />
          <OwnerKpiTile
            label="Departures Tomorrow"
            value={summaryLoading ? "-" : departuresTomorrow.toString()}
            icon={CalendarClock}
            variant={departuresTomorrow > 0 ? "success" : "default"}
            description={summaryLoading ? "Loading" : "Scheduled"}
          />
        </Grid>
        <StaffSignalBadgeGroup
          title="Desk readiness signals"
          signals={[
            { id: "arrivals-feed", label: "Arrivals feed", ready: !summaryLoading && !summaryError },
            { id: "departures-feed", label: "Departures feed", ready: !summaryLoading && !summaryError },
            { id: "transactions-feed", label: "Transactions feed", ready: !transactionsLoading && !transactionsError },
          ]}
        />
      </section>

      <DashboardQuickActions />

      {Boolean(summaryError || transactionsError) && (
        <div className="rounded-lg border border-error-light bg-error-light/20 p-3 text-sm text-error-main">
          There was an error loading dashboard data. Some metrics may be stale.
        </div>
      )}
    </div>
  );
}
