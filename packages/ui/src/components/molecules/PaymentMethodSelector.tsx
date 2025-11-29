import * as React from "react";
import { cn } from "../../utils/style";

export interface PaymentMethod {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface PaymentMethodSelectorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  methods: PaymentMethod[];
  value?: string;
  onChange?: (value: string) => void;
}

/**
 * Radio-group style selector for choosing a payment method.
 */
export function PaymentMethodSelector({
  methods,
  value,
  onChange,
  className,
  ...props
}: PaymentMethodSelectorProps) {
  const group = React.useId();
  return (
    <div className={cn("flex flex-col gap-2", /* i18n-exempt -- DS-1234 [ttl=2025-11-30] */ className)} {...props}>
      {methods.map((m) => (
        <label key={m.value} className="flex cursor-pointer items-center gap-2 min-h-10">
          <input
            type="radio"
            name={group}
            value={m.value}
            checked={value === m.value}
            onChange={() => onChange?.(m.value)}
            className="accent-primary size-11"
          />
          {m.icon && <span className="size-6">{m.icon}</span>}
          <span>{m.label}</span>
        </label>
      ))}
    </div>
  );
}
PaymentMethodSelector.displayName = "PaymentMethodSelector";
