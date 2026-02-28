"use client";

import { useMemo } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system";

import { useAuth } from "../../context/AuthContext";
import useInventoryItems from "../../hooks/data/inventory/useInventoryItems";
import useInventoryLedger from "../../hooks/data/inventory/useInventoryLedger";
import { useTillShiftsData } from "../../hooks/data/till/useTillShiftsData";
import { useCheckins } from "../../hooks/data/useCheckins";
import { canAccess, Permissions } from "../../lib/roles";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function toTimestampMs(timestamp: unknown): number {
  if (typeof timestamp === "number") {
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  if (typeof timestamp === "string") {
    const parsed = Date.parse(timestamp);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function formatDelta(delta: number): string {
  if (delta > 0) {
    return `+${delta}`;
  }

  return String(delta);
}

function formatDateTime(timestamp: unknown): string {
  const parsed = toTimestampMs(timestamp);
  if (parsed <= 0) {
    return "—";
  }
  return new Date(parsed).toLocaleString("it-IT");
}

function formatShiftStatus(status?: "open" | "closed"): string {
  if (status === "open") {
    return "Aperto";
  }
  if (status === "closed") {
    return "Chiuso";
  }
  return "—";
}

function formatCloseDifference(value?: number): string {
  if (value === undefined) {
    return "—";
  }
  return formatDelta(value);
}

export default function ManagerAuditContent() {
  const { user } = useAuth();
  const canView = canAccess(user, Permissions.MANAGEMENT_ACCESS);

  const {
    itemsById,
    loading: inventoryItemsLoading,
    error: inventoryItemsError,
  } = useInventoryItems();
  const {
    entries,
    loading: inventoryLedgerLoading,
    error: inventoryLedgerError,
  } = useInventoryLedger();
  const { shifts, loading: shiftsLoading, error: shiftsError } = useTillShiftsData({
    limitToLast: 3,
  });

  const todayKey = new Date().toISOString().split("T")[0];
  const { checkins, loading: checkinsLoading, error: checkinsError } = useCheckins({
    startAt: todayKey,
    endAt: todayKey,
  });

  const stockVarianceRows = useMemo(() => {
    const todayMinus7 = Date.now() - SEVEN_DAYS_MS;

    return entries
      .filter(
        (entry) =>
          entry.type === "count" && toTimestampMs(entry.timestamp) >= todayMinus7
      )
      .sort(
        (a, b) => toTimestampMs(b.timestamp) - toTimestampMs(a.timestamp)
      );
  }, [entries]);

  const lastThreeShifts = useMemo(
    () =>
      [...shifts].sort(
        (a, b) =>
          toTimestampMs(b.closedAt ?? b.openedAt) -
          toTimestampMs(a.closedAt ?? a.openedAt)
      ),
    [shifts]
  );

  const todayCheckinCount = Object.keys(checkins?.[todayKey] ?? {}).length;

  if (!canView) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">Controllo Manager</h1>

      <section className="rounded-lg border border-border-2 bg-surface p-4">
        <h2 className="text-lg font-semibold text-foreground">Variazione Stock</h2>
        {inventoryItemsLoading || inventoryLedgerLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Caricamento...</p>
        ) : null}
        {!inventoryItemsLoading && !inventoryLedgerLoading && (inventoryItemsError || inventoryLedgerError) ? (
          <p className="mt-3 text-sm text-danger-fg">
            Errore caricamento stock: {String(inventoryItemsError ?? inventoryLedgerError)}
          </p>
        ) : null}
        {!inventoryItemsLoading &&
        !inventoryLedgerLoading &&
        !inventoryItemsError &&
        !inventoryLedgerError ? (
          stockVarianceRows.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Nessuna variazione negli ultimi 7 giorni
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-lg border border-border-2">
              <Table className="min-w-full text-sm">
                <TableHeader className="bg-surface-2">
                  <TableRow>
                    <TableHead className="p-2 text-start border-b border-border-2">
                      Articolo
                    </TableHead>
                    <TableHead className="p-2 text-end border-b border-border-2">
                      Delta
                    </TableHead>
                    <TableHead className="p-2 text-start border-b border-border-2">
                      Data
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockVarianceRows.map((entry) => (
                    <TableRow key={entry.id ?? `${entry.itemId}-${entry.timestamp}`}>
                      <TableCell className="p-2 border-b border-border-2">
                        {itemsById[entry.itemId]?.name ?? entry.itemId}
                      </TableCell>
                      <TableCell className="p-2 border-b border-border-2 text-end font-mono">
                        {formatDelta(entry.quantity)}
                      </TableCell>
                      <TableCell className="p-2 border-b border-border-2">
                        {formatDateTime(entry.timestamp)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        ) : null}
      </section>

      <section className="rounded-lg border border-border-2 bg-surface p-4">
        <h2 className="text-lg font-semibold text-foreground">Ultimi Turni</h2>
        {shiftsLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Caricamento...</p>
        ) : null}
        {!shiftsLoading && shiftsError ? (
          <p className="mt-3 text-sm text-danger-fg">
            Errore caricamento turni: {String(shiftsError)}
          </p>
        ) : null}
        {!shiftsLoading && !shiftsError ? (
          lastThreeShifts.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nessun turno registrato</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-lg border border-border-2">
              <Table className="min-w-full text-sm">
                <TableHeader className="bg-surface-2">
                  <TableRow>
                    <TableHead className="p-2 text-start border-b border-border-2">
                      Stato
                    </TableHead>
                    <TableHead className="p-2 text-start border-b border-border-2">
                      Chiuso il
                    </TableHead>
                    <TableHead className="p-2 text-start border-b border-border-2">
                      Chiuso da
                    </TableHead>
                    <TableHead className="p-2 text-end border-b border-border-2">
                      Differenza
                    </TableHead>
                    <TableHead className="p-2 text-center border-b border-border-2">
                      Signoff
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lastThreeShifts.map((shift) => (
                    <TableRow key={shift.id ?? shift.shiftId}>
                      <TableCell className="p-2 border-b border-border-2">
                        {formatShiftStatus(shift.status)}
                      </TableCell>
                      <TableCell className="p-2 border-b border-border-2">
                        {shift.closedAt ?? "—"}
                      </TableCell>
                      <TableCell className="p-2 border-b border-border-2">
                        {shift.closedBy ?? "—"}
                      </TableCell>
                      <TableCell className="p-2 border-b border-border-2 text-end font-mono">
                        {formatCloseDifference(shift.closeDifference)}
                      </TableCell>
                      <TableCell className="p-2 border-b border-border-2 text-center">
                        {shift.varianceSignoffRequired ? "✓" : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        ) : null}
      </section>

      <section className="rounded-lg border border-border-2 bg-surface p-4">
        <h2 className="text-lg font-semibold text-foreground">Check-in Oggi</h2>
        {checkinsLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Caricamento...</p>
        ) : null}
        {!checkinsLoading && checkinsError ? (
          <p className="mt-3 text-sm text-danger-fg">
            Errore caricamento check-in: {String(checkinsError)}
          </p>
        ) : null}
        {!checkinsLoading && !checkinsError ? (
          <p className="mt-3 text-base font-medium text-foreground">
            {todayCheckinCount} check-in oggi
          </p>
        ) : null}
      </section>
    </div>
  );
}
