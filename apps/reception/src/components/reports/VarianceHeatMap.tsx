"use client";

import { useEffect, useMemo, useState } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";

import { useAuth } from "../../context/AuthContext";
import { useCashCountsData } from "../../hooks/data/useCashCountsData";
import { useVarianceThresholds } from "../../hooks/data/useVarianceThresholds";
import { useVarianceThresholdsMutations } from "../../hooks/mutations/useVarianceThresholdsMutations";
import { canAccess, Permissions } from "../../lib/roles";
import { formatItalyDateFromIso } from "../../utils/dateUtils";
import { showToast } from "../../utils/toastUtils";
import PasswordReauthModal from "../common/PasswordReauthModal";

interface UserShiftMap {
  [user: string]: Record<number, number | undefined>;
}

function getVarianceClass(diff: number | undefined): string {
  if (diff === undefined) return "";
  const abs = Math.abs(diff);
  if (abs < 1) return "bg-success-light";
  if (abs < 5) return "bg-warning-light";
  return "bg-error-light";
}

export default function VarianceHeatMap() {
  const { user } = useAuth();
  const { cashCounts, loading, error } = useCashCountsData();
  const { thresholds, loading: thresholdsLoading } = useVarianceThresholds();
  const { updateThresholds } = useVarianceThresholdsMutations();
  const canManageThresholds = canAccess(user, Permissions.MANAGEMENT_ACCESS);
  const [cashThresholdInput, setCashThresholdInput] = useState<string>("");
  const [keycardThresholdInput, setKeycardThresholdInput] = useState<string>("");
  const [showReauth, setShowReauth] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);

  const { userMap, shiftLabels } = useMemo(() => {
      const closeRecords = cashCounts.filter((c) => c.type === "close");
      const labels = closeRecords.map((c) =>
        formatItalyDateFromIso(c.timestamp)
      );
    const map: UserShiftMap = {};
    closeRecords.forEach((rec, idx) => {
      if (!map[rec.user]) map[rec.user] = {};
      map[rec.user][idx + 1] = rec.difference;
    });
    return { userMap: map, shiftLabels: labels };
  }, [cashCounts]);

  const users = Object.keys(userMap).sort();
  const currentCashThreshold =
    thresholds.cash !== undefined ? thresholds.cash.toFixed(2) : "";
  const currentKeycardThreshold =
    thresholds.keycards !== undefined ? String(thresholds.keycards) : "";

  useEffect(() => {
    if (!thresholdsLoading) {
      if (!cashThresholdInput) {
        setCashThresholdInput(currentCashThreshold);
      }
      if (!keycardThresholdInput) {
        setKeycardThresholdInput(currentKeycardThreshold);
      }
    }
  }, [
    thresholdsLoading,
    cashThresholdInput,
    keycardThresholdInput,
    currentCashThreshold,
    currentKeycardThreshold,
  ]);

  if (loading) {
    return <p>Loading variance data...</p>;
  }
  if (error) {
    return <p className="text-error-main">Failed to load data.</p>;
  }

  return (
    <div className="space-y-6">
      {canManageThresholds && (
        <div className="rounded border border-border bg-surface p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Variance Thresholds</h2>
          <p className="text-sm text-muted-foreground">
            Update the cash variance threshold (in euros) and optional keycard
            variance threshold. Leave keycards empty to disable keycard sign-off.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <label className="flex flex-col text-sm font-semibold">
              Cash threshold (€)
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder={thresholdsLoading ? "Loading..." : currentCashThreshold}
                value={cashThresholdInput}
                onChange={(e) => setCashThresholdInput(e.target.value)}
                className="mt-1 w-40 rounded border px-2 py-1 text-sm"
              />
            </label>
            <label className="flex flex-col text-sm font-semibold">
              Keycard threshold (count)
              <input
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                placeholder={thresholdsLoading ? "Loading..." : currentKeycardThreshold}
                value={keycardThresholdInput}
                onChange={(e) => setKeycardThresholdInput(e.target.value)}
                className="mt-1 w-40 rounded border px-2 py-1 text-sm"
              />
            </label>
            <Button
              type="button"
              disabled={thresholdsLoading || pendingSave}
              onClick={() => {
                if (thresholdsLoading || pendingSave) return;
                const nextCash = cashThresholdInput.trim();
                const nextKeycards = keycardThresholdInput.trim();
                if (!nextCash) {
                  showToast("Cash threshold is required.", "error");
                  return;
                }
                const parsedCash = Number(nextCash);
                if (Number.isNaN(parsedCash) || parsedCash < 0) {
                  showToast("Cash threshold must be a valid number.", "error");
                  return;
                }
                if (nextKeycards) {
                  const parsedKeycards = Number(nextKeycards);
                  if (
                    Number.isNaN(parsedKeycards) ||
                    parsedKeycards < 0 ||
                    !Number.isInteger(parsedKeycards)
                  ) {
                    showToast(
                      "Keycard threshold must be a whole number.",
                      "error"
                    );
                    return;
                  }
                }
                setPendingSave(true);
                setShowReauth(true);
              }}
              className="h-9 rounded bg-primary-main px-4 text-sm text-primary-fg hover:bg-primary-dark disabled:opacity-50"
            >
              Save thresholds
            </Button>
          </div>
          {showReauth && (
            <PasswordReauthModal
              title="Confirm threshold update"
              instructions="Enter your password to update variance thresholds."
              onSuccess={async () => {
                const parsedCash = Number(cashThresholdInput.trim());
                const nextKeycardsRaw = keycardThresholdInput.trim();
                const nextKeycards = nextKeycardsRaw
                  ? Number(nextKeycardsRaw)
                  : undefined;
                try {
                  await updateThresholds(
                    {
                      cash: parsedCash,
                      ...(nextKeycards !== undefined
                        ? { keycards: nextKeycards }
                        : {}),
                    },
                    thresholds
                  );
                  setCashThresholdInput("");
                  setKeycardThresholdInput("");
                } finally {
                  setPendingSave(false);
                  setShowReauth(false);
                }
              }}
              onCancel={() => {
                setPendingSave(false);
                setShowReauth(false);
              }}
            />
          )}
        </div>
      )}
      <div className="overflow-x-auto">
      <Table className="border-collapse w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="p-2 border">Employee</TableHead>
            {shiftLabels.map((label) => (
              <TableHead
                key={label}
                className="p-2 border whitespace-nowrap"
              >
                {label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user} className="text-center">
              <TableCell className="p-2 border text-start font-medium">
                {user}
              </TableCell>
              {shiftLabels.map((label, idx) => {
                const diff = userMap[user]?.[idx + 1];
                const cellClass = getVarianceClass(diff);
                return (
                  <TableCell
                    key={`${user}-${label}`}
                    className={`p-2 border ${cellClass}`}
                  >
                    {diff !== undefined ? diff.toFixed(2) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
