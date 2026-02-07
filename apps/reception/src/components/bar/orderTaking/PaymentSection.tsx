// src/components/bar/orderTaking/PaymentSection.tsx

import React, { type FC, useCallback, useMemo } from "react";

import { useBleepersData } from "../../../hooks/data/bar/useBleepersData";

interface PaymentSectionProps {
  bleepNumber: string;
  onBleepNumberChange: (value: string) => void;
  totalPrice: number;
}

/**
 * PaymentSection
 * – Auto-suggests the next available bleep number (or “go”)
 * – Clear, high-contrast form styling with numeric-only hint
 * – Prominent, right-aligned total price with thousands-separator
 */
const PaymentSection: FC<PaymentSectionProps> = React.memo(
  ({ bleepNumber, onBleepNumberChange, totalPrice }) => {
    const { firstAvailableBleeper } = useBleepersData();

    /* --------------------------- derived state --------------------------- */
    const displayNumber = useMemo(() => {
      const trimmed = bleepNumber.trim().toLowerCase();
      return trimmed === "" || trimmed === "go"
        ? firstAvailableBleeper?.toString() ?? ""
        : bleepNumber;
    }, [bleepNumber, firstAvailableBleeper]);

    /* ----------------------------- handlers ------------------------------ */
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) =>
        onBleepNumberChange(e.target.value),
      [onBleepNumberChange]
    );

    /* ------------------------------ render ------------------------------- */
    return (
      <section className="space-y-5 border-t border-black/10 bg-stone-50/60 p-4 backdrop-blur-md dark:bg-darkSurface dark:text-darkAccentGreen">
        {/* ─────── Bleep input ─────── */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="bleepInput"
            className="text-sm font-medium leading-none text-stone-800"
          >
            Bleep&nbsp;#
          </label>

          <input
            id="bleepInput"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={displayNumber}
            onChange={handleChange}
            placeholder='Leave blank for "go"'
            className="w-full rounded-md border border-stone-300 bg-white/60 py-2 px-3 text-sm shadow-inner focus:border-primary-main focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary-main/40 dark:bg-darkBg dark:text-darkAccentGreen"
          />
        </div>

        {/* ─────── Total ─────── */}
        <p
          className="text-end text-2xl font-extrabold tracking-tight text-stone-900 tabular-nums dark:text-darkAccentGreen"
          aria-live="polite"
        >
          Total:&nbsp;{totalPrice.toFixed(2)}&nbsp;€
        </p>
      </section>
    );
  }
);

PaymentSection.displayName = "PaymentSection";
export default PaymentSection;
