import { useEffect, useState } from "react";

import type { Transaction } from "../../../types/component/Till";
import { useCashDrawerLimit } from "../../data/useCashDrawerLimit";

export type TillCashForm = "none" | "float" | "exchange" | "tenderRemoval";
export type TillRowMode = "none" | "edit" | "delete";

export function useTillReconciliationUI() {
  const { limit: cashDrawerLimit } = useCashDrawerLimit();

  const [cashForm, setCashForm] = useState<TillCashForm>("none");
  const [rowMode, setRowMode] = useState<TillRowMode>("none");
  const [txnToDelete, setTxnToDelete] = useState<Transaction | null>(null);
  const [txnToEdit, setTxnToEdit] = useState<Transaction | null>(null);
  const [drawerLimitInput, setDrawerLimitInput] = useState<string>("0");

  useEffect(() => {
    if (cashDrawerLimit != null) {
      setDrawerLimitInput(cashDrawerLimit.toString());
    } else {
      setDrawerLimitInput("0");
    }
  }, [cashDrawerLimit]);

  const closeCashForms = () => setCashForm("none");
  const handleAddChangeClick = () => setCashForm("float");
  const handleExchangeClick = () => setCashForm("exchange");
  const handleLiftClick = () => setCashForm("tenderRemoval");

  const handleRowClickForEdit = (txn: Transaction) => {
    setTxnToEdit(txn);
    setRowMode("none");
  };

  const handleRowClickForDelete = (txn: Transaction) => {
    setTxnToDelete(txn);
    setRowMode("none");
  };

  return {
    cashForm,
    setCashForm,
    drawerLimitInput,
    setDrawerLimitInput,
    rowMode,
    setRowMode,
    isEditMode: rowMode === "edit",
    isDeleteMode: rowMode === "delete",
    txnToDelete,
    setTxnToDelete,
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
