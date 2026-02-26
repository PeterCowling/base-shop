"use client";

import { memo, useEffect, useState } from "react";

import { Button } from "@acme/design-system/atoms";

import { useSafeData } from "../../context/SafeDataContext";
import { useSafeKeycardCount } from "../../hooks/data/useSafeKeycardCount";
import { getErrorMessage } from "../../utils/errorMessage";
import { showToast } from "../../utils/toastUtils";
import { runTransaction } from "../../utils/transaction";
import { PageShell } from "../common/PageShell";

import { BankDepositForm } from "./BankDepositForm";
import { PettyCashForm } from "./PettyCashForm";
import { SafeReconcileForm } from "./SafeReconcileForm";

function SafeReconciliation(): JSX.Element {
  const {
    safeBalance,
    recordReconcile,
    recordPettyWithdrawal,
    recordBankDeposit,
    recordBankWithdrawal,
    error,
  } = useSafeData();
  const { count: safeKeycards, updateCount } = useSafeKeycardCount();
  type ActiveForm = "reconcile" | "deposit" | "petty" | null;
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);

  useEffect(() => {
    if (error) {
      showToast(getErrorMessage(error), "error");
    }
  }, [error]);

  const handleConfirm = async (
    count: number,
    difference: number,
    keycards: number,
    keycardDifference: number,
    breakdown: Record<string, number>
  ): Promise<void> => {
    try {
      await runTransaction([
        {
          run: () => updateCount(keycards),
          rollback: () => updateCount(safeKeycards),
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
      setActiveForm(null);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const handleBankConfirm = async (
    amount: number,
    keycards: number,
    keycardDifference: number
  ): Promise<void> => {
    const steps = [
      {
        run: () => recordBankDeposit(amount, keycards, keycardDifference),
        rollback: () => recordBankWithdrawal(amount),
      },
      {
        run: () => updateCount(keycards),
        rollback: () => updateCount(safeKeycards),
      },
    ];

    try {
      await runTransaction(steps);
      setActiveForm(null);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const handlePettyConfirm = (amount: number) => {
    recordPettyWithdrawal(amount);
    setActiveForm(null);
  };

  const openForm = (form: ActiveForm) => {
    setActiveForm((current) => (current === form ? current : form));
  };

  return (
    <PageShell title="SAFE RECONCILIATION">
      <div className="bg-surface rounded-xl shadow-lg p-6 space-y-6">
        {/* Balance stat card */}
        <div className="bg-surface-2 rounded-xl border border-border-strong px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Expected Balance
          </p>
          <p className="text-3xl font-heading font-bold text-foreground tabular-nums">
            €{safeBalance.toFixed(2)}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => openForm("reconcile")}
            color="warning"
            tone="solid"
            size="sm"
          >
            Reconcile Safe
          </Button>
          <Button
            onClick={() => openForm("deposit")}
            color="primary"
            tone="solid"
            size="sm"
          >
            Bank Deposit
          </Button>
          <Button
            onClick={() => openForm("petty")}
            color="default"
            tone="outline"
            size="sm"
          >
            Petty Cash
          </Button>
        </div>
        {activeForm === "reconcile" && (
          <SafeReconcileForm
            expectedSafe={safeBalance}
            expectedKeycards={safeKeycards}
            onConfirm={handleConfirm}
            onCancel={() => setActiveForm(null)}
          />
        )}
        {activeForm === "petty" && (
          <PettyCashForm
            onConfirm={handlePettyConfirm}
            onCancel={() => setActiveForm(null)}
          />
        )}
        {activeForm === "deposit" && (
          <BankDepositForm
            currentKeycards={safeKeycards}
            onConfirm={handleBankConfirm}
            onCancel={() => setActiveForm(null)}
          />
        )}
      </div>
    </PageShell>
  );
}

export default memo(SafeReconciliation);
