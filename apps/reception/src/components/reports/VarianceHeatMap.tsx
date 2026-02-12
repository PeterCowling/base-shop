"use client";

import { useEffect, useMemo, useState } from "react";

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
  if (abs < 1) return "bg-green-100 dark:bg-darkAccentGreen";
  if (abs < 5) return "bg-yellow-200 dark:bg-darkAccentOrange";
  return "bg-red-300 dark:bg-darkAccentOrange";
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
    <div className="space-y-6 dark:bg-darkBg dark:text-darkAccentGreen">
      {canManageThresholds && (
        <div className="rounded border border-gray-200 bg-white p-4 shadow-sm dark:border-darkSurface dark:bg-darkSurface">
          <h2 className="text-lg font-semibold mb-3">Variance Thresholds</h2>
          <p className="text-sm text-gray-600 dark:text-darkAccentGreen">
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
                className="mt-1 w-40 rounded border px-2 py-1 text-sm dark:bg-darkBg dark:text-darkAccentGreen"
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
                className="mt-1 w-40 rounded border px-2 py-1 text-sm dark:bg-darkBg dark:text-darkAccentGreen"
              />
            </label>
            <button
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
              className="h-9 rounded bg-primary-main px-4 text-sm text-white hover:bg-primary-dark disabled:opacity-50 dark:bg-darkAccentGreen dark:text-darkBg"
            >
              Save thresholds
            </button>
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
      <div className="overflow-x-auto dark:bg-darkBg dark:text-darkAccentGreen">
      <table className="border-collapse w-full dark:bg-darkSurface dark:text-darkAccentGreen">
        <thead>
          <tr>
            <th className="p-2 border dark:border-darkSurface">Employee</th>
            {shiftLabels.map((label) => (
              <th
                key={label}
                className="p-2 border whitespace-nowrap dark:border-darkSurface"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user} className="text-center">
              <td className="p-2 border text-start font-medium dark:border-darkSurface">
                {user}
              </td>
              {shiftLabels.map((label, idx) => {
                const diff = userMap[user]?.[idx + 1];
                const cellClass = getVarianceClass(diff);
                return (
                  <td
                    key={`${user}-${label}`}
                    className={`p-2 border dark:border-darkSurface ${cellClass}`}
                  >
                    {diff !== undefined ? diff.toFixed(2) : "-"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
