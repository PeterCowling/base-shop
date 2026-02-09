"use client";

import { memo, useEffect, useState } from "react";

import { useSafeData } from "../../context/SafeDataContext";
import { useSafeKeycardCount } from "../../hooks/data/useSafeKeycardCount";
import { getErrorMessage } from "../../utils/errorMessage";
import { showToast } from "../../utils/toastUtils";
import { runTransaction } from "../../utils/transaction";

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
    <div className="min-h-[80vh] p-4 bg-gray-100 font-sans text-gray-800 dark:bg-darkBg dark:text-darkAccentGreen">
      <h1 className="text-5xl font-heading text-primary-main w-full text-center mb-6">
        SAFE MANAGEMENT
      </h1>
      <div className="bg-white rounded-lg shadow p-6 space-y-4 dark:bg-darkSurface">
        <p className="text-lg">
          Expected Balance: <strong>€{safeBalance.toFixed(2)}</strong>
        </p>
        <div className="flex gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => openForm("reconcile")}
              className="px-4 py-2 bg-warning-main text-white rounded hover:bg-warning-dark"
            >
              Reconcile Safe
            </button>
            <button
              onClick={() => openForm("deposit")}
              className="px-4 py-2 bg-primary-main text-white rounded hover:bg-primary-dark"
            >
              Bank Deposit
            </button>
          </div>
          <button
            onClick={() => openForm("petty")}
            className="px-4 py-2 bg-primary-main text-white rounded hover:bg-primary-dark"
          >
            Petty Cash
          </button>
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
    </div>
  );
}

export default memo(SafeReconciliation);
