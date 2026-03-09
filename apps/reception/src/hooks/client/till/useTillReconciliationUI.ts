import { useCallback, useEffect, useState } from "react";

import type { Transaction } from "../../../types/component/Till";
import { useCashDrawerLimit } from "../../data/useCashDrawerLimit";

export type TillCashForm = "none" | "float" | "exchange" | "tenderRemoval";

export function useTillReconciliationUI() {
  const { limit: cashDrawerLimit } = useCashDrawerLimit();

  const [cashForm, setCashForm] = useState<TillCashForm>("none");
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
    setCashForm("none");
  }, []);

  const handleAddChangeClick = useCallback(() => {
    setCashForm("float");
  }, []);

  const handleExchangeClick = useCallback(() => {
    setCashForm("exchange");
  }, []);

  const handleLiftClick = useCallback(() => {
    setCashForm("tenderRemoval");
  }, []);

  const handleRowClickForEdit = useCallback((txn: Transaction) => {
    setTxnToEdit(txn);
    setIsEditMode(false);
  }, []);

  const handleRowClickForDelete = useCallback((txn: Transaction) => {
    setTxnToDelete(txn);
    setIsDeleteMode(false);
  }, []);

  return {
    cashForm,
    setCashForm,
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
