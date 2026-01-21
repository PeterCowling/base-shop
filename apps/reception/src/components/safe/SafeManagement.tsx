import { Fragment, memo, useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { useSafeKeycardCount } from "../../hooks/data/useSafeKeycardCount";
import { useSafeData } from "../../context/SafeDataContext";
import { useTillShiftActions } from "../../hooks/client/till/useTillShiftActions";
import { useCashCounts } from "../../hooks/useCashCounts";
import { useKeycardTransfer } from "../../hooks/useKeycardTransfer";
import ReturnKeycardsModal from "../till/ReturnKeycardsModal";
import { ExchangeNotesForm } from "../till/ExchangeNotesForm";
import { SafeDepositForm } from "./SafeDepositForm";
import { BankDepositForm } from "./BankDepositForm";
import { PettyCashForm } from "./PettyCashForm";
import { SafeOpenForm } from "./SafeOpenForm";
import { SafeResetForm } from "./SafeResetForm";
import { SafeReconcileForm } from "./SafeReconcileForm";
import { SafeWithdrawalForm } from "./SafeWithdrawalForm";
import type { SafeCount } from "../../types/hooks/data/safeCountData";
import { showToast } from "../../utils/toastUtils";
import { getErrorMessage } from "../../utils/errorMessage";
import { runTransaction } from "../../utils/transaction";
import { formatEnGbDateTimeFromIso } from "../../utils/dateUtils";

function SafeManagement(): JSX.Element {
  const {
    safeCounts,
    safeBalance,
    recordDeposit,
    recordWithdrawal,
    recordExchange,
    recordOpening,
    recordReset,
    recordReconcile,
    recordBankDeposit,
    recordBankWithdrawal,
    recordPettyWithdrawal,
    error,
  } = useSafeData();
  const { user } = useAuth();
  const isPete = user?.user_name.toLowerCase() === "pete";
  const { count: safeKeycards, updateCount: updateSafeKeycards } =
    useSafeKeycardCount();
  const { addCashCount, recordFloatEntry } = useCashCounts();
  const { returnKeycardsToSafe } = useTillShiftActions();
  const recordKeycardTransfer = useKeycardTransfer();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [showExchange, setShowExchange] = useState(false);
  const [showBankDeposit, setShowBankDeposit] = useState(false);
  const [showPettyCash, setShowPettyCash] = useState(false);
  const [showReconcile, setShowReconcile] = useState(false);
  const [showOpen, setShowOpen] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  useEffect(() => {
    if (error) {
      showToast(getErrorMessage(error), "error");
    }
  }, [error]);

  const handleDeposit = async (
    amount: number,
    keycardCount: number,
    keycardDifference: number,
    breakdown: Record<string, number>
  ) => {
    const steps = [
      {
        run: () =>
          recordDeposit(amount, keycardCount, keycardDifference, breakdown),
        rollback: () => recordWithdrawal(amount, breakdown, true),
      },
      {
        run: () => addCashCount("tenderRemoval", 0, 0, amount),
        rollback: () => addCashCount("tenderRemoval", 0, 0, -amount),
      },
    ];

    if (keycardDifference !== 0) {
      steps.push({
        run: () => updateSafeKeycards(keycardCount),
        rollback: () => updateSafeKeycards(safeKeycards),
      });
    }

    try {
      await runTransaction(steps);
      setShowDeposit(false);
    } catch (error) {
      showToast("Failed to record deposit.", "error");
    }
  };

  const handleWithdrawal = async (
    amount: number,
    breakdown: Record<string, number>
  ) => {
    try {
      await runTransaction([
        {
          run: () => recordWithdrawal(amount, breakdown),
          rollback: () => recordDeposit(amount, 0, 0, breakdown),
        },
        { run: () => recordFloatEntry(amount) },
      ]);
      setShowWithdrawal(false);
    } catch (error) {
      showToast("Failed to record withdrawal.", "error");
    }
  };

  const handleExchange = async (
    outgoing: Record<string, number>,
    incoming: Record<string, number>,
    direction: "drawerToSafe" | "safeToDrawer",
    total: number
  ) => {
    try {
      const steps = [
        {
          run: () => recordExchange(outgoing, incoming, direction, total),
          rollback: () =>
            recordExchange(
              incoming,
              outgoing,
              direction === "drawerToSafe" ? "safeToDrawer" : "drawerToSafe",
              total
            ),
        },
      ];

      if (direction === "drawerToSafe") {
        steps.push({
          run: () => addCashCount("tenderRemoval", 0, 0, total),
          rollback: () => addCashCount("tenderRemoval", 0, 0, -total),
        });
      } else {
        steps.push({
          run: () => recordFloatEntry(total),
          rollback: () => recordFloatEntry(-total),
        });
      }

      await runTransaction(steps);
      setShowExchange(false);
    } catch (error) {
      showToast("Failed to record exchange.", "error");
    }
  };

  const handleOpen = async (count: number, keycards: number) => {
    try {
      await runTransaction([
        {
          run: async () => {
            await updateSafeKeycards(keycards);
          },
          rollback: async () => {
            await updateSafeKeycards(safeKeycards);
          },
        },
        {
          run: () => recordOpening(count, keycards),
        },
      ]);
      setShowOpen(false);
    } catch (error) {
      showToast("Failed to record opening.", "error");
    }
  };

  const handleReset = async (
    count: number,
    keycards: number,
    keycardDifference: number,
    breakdown: Record<string, number>
  ) => {
    try {
      await runTransaction([
        {
          run: async () => {
            await updateSafeKeycards(keycards);
          },
          rollback: async () => {
            await updateSafeKeycards(safeKeycards);
          },
        },
        {
          run: () =>
            recordReset(count, keycards, keycardDifference, breakdown),
        },
      ]);
      setShowReset(false);
    } catch (error) {
      showToast("Failed to record reset.", "error");
    }
  };

  const handleReconcile = async (
    count: number,
    difference: number,
    keycards: number,
    keycardDifference: number,
    breakdown: Record<string, number>
  ) => {
    try {
      await runTransaction([
        {
          run: async () => {
            await updateSafeKeycards(keycards);
          },
          rollback: async () => {
            await updateSafeKeycards(safeKeycards);
          },
        },
        {
          run: () =>
            recordReconcile(
              count,
              difference,
              keycards,
              keycardDifference,
              breakdown
            ),
        },
      ]);
      setShowReconcile(false);
    } catch (error) {
      showToast("Failed to record reconciliation.", "error");
    }
  };

  const handleBankDeposit = async (
    amount: number,
    keycards: number,
    keycardDifference: number
  ) => {
    const newKeycardTotal = safeKeycards + keycardDifference;
    const steps = [
      {
        run: () => recordBankDeposit(amount, keycards, keycardDifference),
        rollback: () => recordBankWithdrawal(amount),
      },
    ];

    if (keycardDifference !== 0) {
      steps.push({
        run: () => updateSafeKeycards(newKeycardTotal),
        rollback: () => updateSafeKeycards(safeKeycards),
      });
    }

    try {
      await runTransaction(steps);
      setShowBankDeposit(false);
    } catch (error) {
      showToast("Failed to record bank deposit.", "error");
    }
  };

  const handlePettyCash = async (amount: number) => {
    try {
      await recordPettyWithdrawal(amount);
      setShowPettyCash(false);
    } catch (error) {
      showToast("Failed to record petty cash withdrawal.", "error");
    }
  };

  const handleReturn = async (count: number) => {
    try {
      await runTransaction([
        {
          run: async () => {
            const success = returnKeycardsToSafe(count);
            if (!success) {
              throw new Error("return failed");
            }
          },
          rollback: async () => {
            returnKeycardsToSafe(-count);
          },
        },
        {
          run: async () => {
            await updateSafeKeycards(safeKeycards + count);
          },
          rollback: async () => {
            await updateSafeKeycards(safeKeycards);
          },
        },
        {
          run: () => recordKeycardTransfer(count, "toSafe"),
        },
      ]);
      setShowReturn(false);
    } catch (error) {
      if ((error as Error).message !== "return failed") {
        showToast("Failed to record keycard transfer.", "error");
      }
    }
  };

  const toggleDetails = (idx: number) => {
    setExpandedRows((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const renderBreakdown = (
    breakdown: NonNullable<SafeCount["denomBreakdown"]>
  ): JSX.Element => {
    const renderLines = (b: Record<string, number>) => (
      <div className="flex flex-wrap gap-2">
        {Object.entries(b).map(([denom, qty]) => (
          <span key={denom}>
            €{parseFloat(denom).toFixed(2)} x {qty}
          </span>
        ))}
      </div>
    );
    type ExchangeBreakdown = {
      incoming: Record<string, number>;
      outgoing: Record<string, number>;
    };

    const isExchangeBreakdown = (
      b: NonNullable<SafeCount["denomBreakdown"]>
    ): b is ExchangeBreakdown =>
      typeof b === "object" &&
      "incoming" in b &&
      typeof (b as { incoming: unknown }).incoming === "object";

    if (isExchangeBreakdown(breakdown)) {
      return (
        <div className="flex flex-col gap-2 md:flex-row md:gap-4">
          <div>
            <strong>Outgoing:</strong> {renderLines(breakdown.outgoing)}
          </div>
          <div>
            <strong>Incoming:</strong> {renderLines(breakdown.incoming)}
          </div>
        </div>
      );
    }

    return renderLines(breakdown as Record<string, number>);
  };

  return (
    <div className="min-h-[80vh] p-4 bg-gray-100 font-sans text-gray-800 dark:bg-darkBg dark:text-darkAccentGreen">
      <h1 className="text-5xl font-heading text-primary-main w-full text-center mb-6">
        SAFE MANAGEMENT
      </h1>
      <div className="bg-white rounded-lg shadow p-6 space-y-4 dark:bg-darkSurface">
        <p className="text-lg">
          Safe Balance: <strong>€{safeBalance.toFixed(2)}</strong>
        </p>
        <p className="text-lg">
          Keycards in Safe: <strong>{safeKeycards}</strong>
        </p>
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {isPete && (
              <button
                onClick={() => setShowOpen(true)}
                className="px-4 py-2 bg-primary-main text-white rounded hover:bg-primary-dark"
              >
                Open
              </button>
            )}
            <button
              onClick={() => setShowDeposit(true)}
              className="px-4 py-2 bg-primary-main text-white rounded hover:bg-primary-dark"
            >
              Deposit
            </button>
            <button
              onClick={() => setShowWithdrawal(true)}
              className="px-4 py-2 bg-primary-main text-white rounded hover:bg-primary-dark"
            >
              Withdraw
            </button>
            <button
              onClick={() => setShowExchange(true)}
              className="px-4 py-2 bg-primary-main text-white rounded hover:bg-primary-dark"
            >
              Exchange
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowBankDeposit(true)}
              className="px-4 py-2 bg-primary-main text-white rounded hover:bg-primary-dark"
            >
              Bank Deposit
            </button>
            <button
              onClick={() => setShowPettyCash(true)}
              className="px-4 py-2 bg-primary-main text-white rounded hover:bg-primary-dark"
            >
              Petty Cash
            </button>
            <button
              onClick={() => setShowReset(true)}
              className="px-4 py-2 bg-primary-main text-white rounded hover:bg-primary-dark"
            >
              Reset Safe
            </button>
            <button
              onClick={() => setShowReturn(true)}
              className="px-4 py-2 bg-primary-main text-white rounded hover:bg-primary-dark"
            >
              Return Keycards
            </button>
            <button
              onClick={() => setShowReconcile(true)}
              className="px-4 py-2 bg-warning-main text-white rounded hover:bg-warning-dark"
            >
              Reconcile
            </button>
          </div>
        </div>
        {showOpen && (
          <SafeOpenForm
            onConfirm={handleOpen}
            onCancel={() => setShowOpen(false)}
          />
        )}
        {showDeposit && (
          <SafeDepositForm
            currentKeycards={safeKeycards}
            onConfirm={handleDeposit}
            onCancel={() => setShowDeposit(false)}
          />
        )}
        {showWithdrawal && (
          <SafeWithdrawalForm
            onConfirm={handleWithdrawal}
            onCancel={() => setShowWithdrawal(false)}
          />
        )}
        {showExchange && (
          <ExchangeNotesForm
            onConfirm={handleExchange}
            onCancel={() => setShowExchange(false)}
          />
        )}
        {showBankDeposit && (
          <BankDepositForm
            currentKeycards={safeKeycards}
            onConfirm={handleBankDeposit}
            onCancel={() => setShowBankDeposit(false)}
          />
        )}
        {showPettyCash && (
          <PettyCashForm
            onConfirm={handlePettyCash}
            onCancel={() => setShowPettyCash(false)}
          />
        )}
        {showReset && (
          <SafeResetForm
            currentKeycards={safeKeycards}
            onConfirm={handleReset}
            onCancel={() => setShowReset(false)}
          />
        )}
        {showReturn && (
          <ReturnKeycardsModal
            onConfirm={handleReturn}
            onCancel={() => setShowReturn(false)}
          />
        )}
        {showReconcile && (
          <SafeReconcileForm
            expectedSafe={safeBalance}
            expectedKeycards={safeKeycards}
            onConfirm={handleReconcile}
            onCancel={() => setShowReconcile(false)}
          />
        )}
        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold mb-2">Transactions</h2>
          {safeCounts.length === 0 ? (
            <div className="italic text-gray-600 dark:text-darkAccentGreen">
              No transactions recorded.
            </div>
          ) : (
            <table
              className="w-full border-collapse"
              aria-label="safe transactions"
            >
              <thead className="bg-gray-100 dark:bg-darkSurface">
                <tr>
                  <th className="text-left p-2 border-b">Timestamp</th>
                  <th className="text-left p-2 border-b">Type</th>
                  <th className="text-left p-2 border-b">Amount/Count</th>
                  <th className="text-left p-2 border-b">Keycards</th>
                  <th className="text-left p-2 border-b">User</th>
                  <th className="text-left p-2 border-b">Details</th>
                </tr>
              </thead>
              <tbody>
                {safeCounts.map((s, idx) => (
                  <Fragment key={s.id ?? `${s.timestamp}-${idx}`}>
                    <tr
                      className={
                        idx % 2 === 0
                          ? "bg-white dark:bg-darkSurface"
                          : "bg-gray-50 dark:bg-darkSurface"
                      }
                    >
                      <td className="p-2">
                        {formatEnGbDateTimeFromIso(s.timestamp)}
                      </td>
                      <td className="p-2">{s.type}</td>
                      <td className="p-2">
                        {s.amount !== undefined
                          ? `€${s.amount.toFixed(2)}`
                          : s.count !== undefined
                          ? `€${s.count.toFixed(2)}${
                              s.difference !== undefined
                                ? ` (${s.difference >= 0 ? "+" : ""}${s.difference.toFixed(2)})`
                                : ""
                            }`
                          : "-"}
                      </td>
                      <td className="p-2">
                        {s.keycardCount !== undefined
                          ? `${s.keycardCount}${
                              s.keycardDifference !== undefined
                                ? ` (${s.keycardDifference && s.keycardDifference >= 0 ? "+" : ""}${s.keycardDifference})`
                                : ""
                            }`
                          : "-"}
                      </td>
                      <td className="p-2">{s.user}</td>
                      <td className="p-2">
                        {s.denomBreakdown ? (
                          <button
                            onClick={() => toggleDetails(idx)}
                            className="text-primary-main underline"
                          >
                            {expandedRows.includes(idx)
                              ? "Hide Details"
                              : "View Details"}
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                    {expandedRows.includes(idx) && s.denomBreakdown && (
                      <tr
                        className={
                          idx % 2 === 0
                            ? "bg-white dark:bg-darkSurface"
                            : "bg-gray-50 dark:bg-darkSurface"
                        }
                      >
                        <td colSpan={6} className="p-2">
                          {renderBreakdown(s.denomBreakdown)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(SafeManagement);
