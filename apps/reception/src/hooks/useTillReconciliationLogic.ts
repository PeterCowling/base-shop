import { useCallback, useEffect,useState } from "react";

import type { TenderRemovalRecord } from "../types/finance";
import { showToast } from "../utils/toastUtils";
import { runTransaction } from "../utils/transaction";

import type { TillCashForm } from "./client/till/useTillReconciliationUI";
import { useTillShifts } from "./client/till/useTillShifts";
import { useCashDrawerLimit } from "./data/useCashDrawerLimit";
import { useSafeKeycardCount } from "./data/useSafeKeycardCount";
import { useCashCounts } from "./useCashCounts";
import { useKeycardTransfer } from "./useKeycardTransfer";
import { useSafeLogic } from "./useSafeLogic";

export interface TillReconciliationUIControls {
  closeCashForms: () => void;
  setCashForm: (v: TillCashForm) => void;
  cashForm: TillCashForm;
}

export function useTillReconciliationLogic(
  ui: TillReconciliationUIControls
) {
  const tillLogic = useTillShifts();
  const { recordFloatEntry, addCashCount } = useCashCounts();
  const {
    recordDeposit,
    recordWithdrawal,
    recordBankWithdrawal,
    recordBankDeposit,
    recordExchange,
  } = useSafeLogic();
  const { count: safeKeycards, updateCount: updateSafeKeycards } =
    useSafeKeycardCount();
  const { updateLimit } = useCashDrawerLimit();
  const recordKeycardTransfer = useKeycardTransfer();
  const [showAddKeycardModal, setShowAddKeycardModal] = useState(false);
  const [showReturnKeycardModal, setShowReturnKeycardModal] = useState(false);

  const {
    setShowOpenShiftForm,
    setShowCloseShiftForm,
    closeShiftFormVariant,
    setShowKeycardCountForm,
  } = tillLogic;

  const closeShiftForms = useCallback(() => {
    setShowOpenShiftForm(false);
    setShowCloseShiftForm(false);
    setShowKeycardCountForm(false);
  }, [setShowOpenShiftForm, setShowCloseShiftForm, setShowKeycardCountForm]);

  const closeAllForms = useCallback(() => {
    ui.closeCashForms();
    closeShiftForms();
  }, [ui, closeShiftForms]);

  useEffect(() => {
    if (ui.cashForm !== "none") {
      closeShiftForms();
    }
  }, [ui.cashForm, closeShiftForms]);

  const handleAddKeycard = useCallback(() => {
    closeAllForms();
    setShowAddKeycardModal(true);
  }, [closeAllForms]);

  const handleReturnKeycard = useCallback(() => {
    closeAllForms();
    setShowReturnKeycardModal(true);
  }, [closeAllForms]);

  const confirmAddKeycard = useCallback(
    async (count: number) => {
      if (count > safeKeycards) {
        showToast("Not enough keycards in safe.", "error");
        return;
      }
      tillLogic.addKeycardsFromSafe(count);
      setShowAddKeycardModal(false);
      try {
        await recordKeycardTransfer(count, "fromSafe");
        updateSafeKeycards(safeKeycards - count);
      } catch {
        showToast("Failed to record keycard transfer.", "error");
      }
    },
    [tillLogic, updateSafeKeycards, safeKeycards, recordKeycardTransfer]
  );

  const cancelAddKeycard = useCallback(() => {
    setShowAddKeycardModal(false);
  }, []);

  const confirmReturnKeycard = useCallback(
    async (count: number) => {
      const success = tillLogic.returnKeycardsToSafe(count);
      if (!success) {
        return;
      }
      setShowReturnKeycardModal(false);
      try {
        await recordKeycardTransfer(count, "toSafe");
        updateSafeKeycards(safeKeycards + count);
      } catch {
        showToast("Failed to record keycard transfer.", "error");
      }
    },
    [tillLogic, updateSafeKeycards, safeKeycards, recordKeycardTransfer]
  );

  const cancelReturnKeycard = useCallback(() => {
    setShowReturnKeycardModal(false);
  }, []);

  const confirmFloat = useCallback(
    async (amount: number) => {
      try {
        await runTransaction([
          {
            run: () => recordWithdrawal(amount),
            rollback: () => recordDeposit(amount, 0, 0),
          },
          { run: () => recordFloatEntry(amount) },
        ]);
        ui.setCashForm("none");
      } catch {
        showToast("Failed to confirm float.", "error");
      }
    },
    [recordWithdrawal, recordDeposit, recordFloatEntry, ui]
  );

  const confirmExchange = useCallback(
    async (
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
          ...(direction === "drawerToSafe"
            ? [
                {
                  run: () => addCashCount("tenderRemoval", 0, 0, total),
                  rollback: () =>
                    addCashCount("tenderRemoval", 0, 0, -total),
                },
              ]
            : []),
          { run: () => recordFloatEntry(total) },
        ];

        await runTransaction(steps);
        ui.setCashForm("none");
      } catch {
        showToast("Failed to record exchange.", "error");
      }
    },
    [recordExchange, addCashCount, recordFloatEntry, ui]
  );

  const handleTenderRemoval = useCallback(
    async (rec: TenderRemovalRecord) => {
      try {
        await runTransaction([
          {
            run: () => addCashCount("tenderRemoval", 0, 0, rec.amount),
            rollback: () => addCashCount("tenderRemoval", 0, 0, -rec.amount),
          },
          {
            run: () => {
              if (rec.removalType === "SAFE_DROP" || rec.removalType === "LIFT") {
                return recordDeposit(rec.amount, 0, 0, undefined);
              }
              if (rec.removalType === "BANK_DROP") {
                return recordBankDeposit(rec.amount, 0, 0);
              }
              return Promise.resolve();
            },
            rollback: () => {
              if (rec.removalType === "SAFE_DROP" || rec.removalType === "LIFT") {
                return recordWithdrawal(rec.amount, undefined);
              }
              if (rec.removalType === "BANK_DROP") {
                return recordBankWithdrawal(rec.amount);
              }
              return Promise.resolve();
            },
          },
        ]);
        ui.setCashForm("none");
      } catch {
        showToast("Failed to record tender removal.", "error");
      }
    },
    [
      addCashCount,
      recordDeposit,
      recordBankDeposit,
      recordWithdrawal,
      recordBankWithdrawal,
      ui,
    ]
  );

  const handleOpenShiftClick = useCallback(() => {
    closeAllForms();
    tillLogic.handleOpenShiftClick();
  }, [closeAllForms, tillLogic]);

  const handleCloseShiftClick = useCallback(
    (variant: "close" | "reconcile") => {
      closeAllForms();
      tillLogic.handleCloseShiftClick(variant);
    },
    [closeAllForms, tillLogic]
  );

  const handleKeycardCountClick = useCallback(() => {
    closeAllForms();
    tillLogic.handleKeycardCountClick();
  }, [closeAllForms, tillLogic]);

  return {
    ...tillLogic,
    updateLimit,
    showAddKeycardModal,
    showReturnKeycardModal,
    confirmAddKeycard,
    confirmReturnKeycard,
    cancelAddKeycard,
    cancelReturnKeycard,
    handleAddKeycard,
    handleReturnKeycard,
    confirmFloat,
    confirmExchange,
    handleTenderRemoval,
    handleOpenShiftClick,
    handleCloseShiftClick,
    handleKeycardCountClick,
    closeShiftFormVariant,
  } as const;
}
