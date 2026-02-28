/* File: src/components/bar/orderTaking/modal/PayModal.tsx */

import {
  type ComponentType,
  memo,
  type MouseEvent,
  type ReactElement,
  useCallback,
  useState,
} from "react";
import { Banknote, Check, CreditCard, Nfc } from "lucide-react";

import { cn } from "@acme/design-system/utils/style";
import { SimpleModal } from "@acme/ui/molecules";

export interface PayModalProps {
  onConfirm: (
    paymentMethod: "cash" | "card",
    bleepUsage: "bleep" | "go"
  ) => void;
  onCancel: () => void;
}

interface SelectCardProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
}

function SelectCard({ selected, onClick, label, Icon }: SelectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border-2 p-5 min-h-24 transition-all duration-150 active:scale-95",
        selected
          ? "border-primary-main/100 bg-primary-soft/100 text-primary-main/100"
          : "border-border-2 bg-surface-2 text-muted-foreground hover:border-border-strong"
      )}
    >
      <Icon size={28} />
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

function PayModalBase({ onConfirm, onCancel }: PayModalProps): ReactElement {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("card");
  const [bleepUsage, setBleepUsage] = useState<"bleep" | "go">("bleep");

  const handleConfirmClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      onConfirm(paymentMethod, bleepUsage);
    },
    [onConfirm, paymentMethod, bleepUsage]
  );

  return (
    <SimpleModal
      isOpen
      onClose={onCancel}
      title="Complete Payment"
      maxWidth="max-w-sm"
    >
      <div className="space-y-6">
        {/* Payment Method */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Payment Method
          </p>
          <div className="flex gap-3">
            <SelectCard
              selected={paymentMethod === "cash"}
              onClick={() => setPaymentMethod("cash")}
              Icon={Banknote}
              label="Cash"
            />
            <SelectCard
              selected={paymentMethod === "card"}
              onClick={() => setPaymentMethod("card")}
              Icon={CreditCard}
              label="Credit Card"
            />
          </div>
        </section>

        {/* Bleep or Go */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bleep or Go
          </p>
          <div className="flex gap-3">
            <SelectCard
              selected={bleepUsage === "bleep"}
              onClick={() => setBleepUsage("bleep")}
              Icon={Nfc}
              label="Bleep"
            />
            <SelectCard
              selected={bleepUsage === "go"}
              onClick={() => setBleepUsage("go")}
              Icon={Check}
              label="Go"
            />
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-lg border border-border-2 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            className="flex-1 min-h-11 rounded-lg bg-primary-main/100 px-4 py-2 text-sm font-bold text-primary-fg/100 transition-all duration-150 hover:opacity-90 active:scale-95"
          >
            Confirm Payment
          </button>
        </div>
      </div>
    </SimpleModal>
  );
}

PayModalBase.displayName = "PayModalBase";

const PayModal = memo(PayModalBase);
export default PayModal;
