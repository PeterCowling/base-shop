import { type FC, memo, useCallback, useState } from "react";

import { Textarea } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";
import { SimpleModal } from "@acme/ui/molecules";

import useVoidTransaction from "../../hooks/mutations/useVoidTransaction";
import { type Transaction } from "../../types/component/Till";
import { showToast } from "../../utils/toastUtils";
import PasswordReauthInline from "../common/PasswordReauthInline";

interface VoidTransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
}

const VoidTransactionModal: FC<VoidTransactionModalProps> = ({
  transaction,
  onClose,
}) => {
  const { voidTransaction, loading, error } = useVoidTransaction();
  const [reason, setReason] = useState("");

  const handleVoid = useCallback(async () => {
    if (!reason.trim()) {
      showToast("Void reason is required.", "error");
      return;
    }
    try {
      await voidTransaction(transaction.txnId, reason.trim());
      onClose();
    } catch (err) {
      console.error("[VoidTransactionModal] Void error:", err);
    }
  }, [voidTransaction, transaction.txnId, reason, onClose]);

  return (
    <SimpleModal
      isOpen={true}
      onClose={onClose}
      title="Void Transaction"
      maxWidth="max-w-sm"
      footer={
        <Button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-surface-3 hover:bg-surface-2 text-foreground"
        >
          Cancel
        </Button>
      }
    >
      <p className="mb-4">
        Are you sure you want to void transaction{" "}
        <strong>{transaction.description || transaction.txnId}</strong>?
      </p>
      <label className="block text-sm font-semibold mb-2">
        Reason
        <Textarea
          compatibilityMode="no-wrapper"
          className="mt-1 w-full rounded-lg border p-2 text-sm text-foreground"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this transaction being voided?"
        />
      </label>
      <p className="text-error-main text-sm mb-4">
        This action cannot be undone.
      </p>
      {Boolean(error) && (
        <p className="text-error-main text-sm mb-4">
          An error occurred while voiding. Please try again.
        </p>
      )}
      <PasswordReauthInline
        onSubmit={handleVoid}
        submitLabel={loading ? "Voiding..." : "Confirm Void"}
      />
    </SimpleModal>
  );
};

export default memo(VoidTransactionModal);
