import { useCallback, useEffect, useState } from "react";

import type { Transaction } from "../../../types/component/Till";
import { useCashDrawerLimit } from "../../data/useCashDrawerLimit";

export function useTillReconciliationUI() {
  const { limit: cashDrawerLimit } = useCashDrawerLimit();

  const [showFloatForm, setShowFloatForm] = useState(false);
  const [showExchangeForm, setShowExchangeForm] = useState(false);
  const [showTenderRemovalForm, setShowTenderRemovalForm] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [txnToDelete, setTxnToDelete] = useState<Transaction | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [txnToEdit, setTxnToEdit] = useState<Transaction | null>(null);
  const [drawerLimitInput, setDrawerLimitInput] = useState<string>("0");

  useEffect(() => {
    if (cashDrawerLimit != null) {
      setDrawerLimitInput(cashDrawerLimit.toString());
    } else {
      setDrawerLimitInput("0");
    }
  }, [cashDrawerLimit]);

  const closeCashForms = useCallback(() => {
    setShowFloatForm(false);
    setShowExchangeForm(false);
    setShowTenderRemovalForm(false);
  }, []);

  const handleAddChangeClick = useCallback(() => {
    closeCashForms();
    setShowFloatForm(true);
  }, [closeCashForms]);

  const handleExchangeClick = useCallback(() => {
    closeCashForms();
    setShowExchangeForm(true);
  }, [closeCashForms]);

  const handleLiftClick = useCallback(() => {
    closeCashForms();
    setShowTenderRemovalForm(true);
  }, [closeCashForms]);

  const handleRowClickForEdit = useCallback((txn: Transaction) => {
    setTxnToEdit(txn);
    setIsEditMode(false);
  }, []);

  const handleRowClickForDelete = useCallback((txn: Transaction) => {
    setTxnToDelete(txn);
    setIsDeleteMode(false);
  }, []);

  return {
    showFloatForm,
    setShowFloatForm,
    showExchangeForm,
    setShowExchangeForm,
    showTenderRemovalForm,
    setShowTenderRemovalForm,
    drawerLimitInput,
    setDrawerLimitInput,
    isDeleteMode,
    setIsDeleteMode,
    txnToDelete,
    setTxnToDelete,
    isEditMode,
    setIsEditMode,
    txnToEdit,
    setTxnToEdit,
    closeCashForms,
    handleAddChangeClick,
    handleExchangeClick,
    handleLiftClick,
    handleRowClickForDelete,
    handleRowClickForEdit,
  } as const;
}
