/**
 * CashPrep.tsx
 *
 * Component for displaying and confirming cash preparedness for check-in.
 * Shows city tax and keycard deposit amounts.
 */

'use client';

import { type FC, memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Banknote,
  Check,
  CheckCircle2,
  Circle,
  CreditCard,
  Info,
} from 'lucide-react';

interface CashPrepProps {
  /** City tax amount in EUR */
  cityTaxAmount: number;
  /** Keycard deposit amount in EUR */
  depositAmount: number;
  /** Whether city tax cash is ready */
  cityTaxReady?: boolean;
  /** Whether deposit cash is ready */
  depositReady?: boolean;
  /** Handler for confirming cash readiness */
  onConfirm: (cityTaxReady: boolean, depositReady: boolean) => void;
  /** Handler to go back */
  onBack?: () => void;
}

export const CashPrep: FC<CashPrepProps> = memo(function CashPrep({
  cityTaxAmount,
  depositAmount,
  cityTaxReady: initialCityTaxReady = false,
  depositReady: initialDepositReady = false,
  onConfirm,
  onBack,
}) {
  const { t } = useTranslation('PreArrival');

  // State
  const [cityTaxReady, setCityTaxReady] = useState(initialCityTaxReady);
  const [depositReady, setDepositReady] = useState(initialDepositReady);

  // Total amount
  const totalAmount = useMemo(
    () => cityTaxAmount + depositAmount,
    [cityTaxAmount, depositAmount],
  );

  // All ready?
  const allReady = useMemo(
    () => cityTaxReady && depositReady,
    [cityTaxReady, depositReady],
  );

  // Handle confirm
  const handleConfirm = useCallback(() => {
    onConfirm(cityTaxReady, depositReady);
  }, [cityTaxReady, depositReady, onConfirm]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-1 rounded-full p-2 hover:bg-muted"
            aria-label={t('cash.back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {t('cash.title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('cash.subtitle')}</p>
        </div>
      </div>

      {/* Cash info card */}
      <div className="rounded-xl bg-success-soft p-4">
        <div className="mb-4 flex items-center gap-2 text-success-foreground">
          <Banknote className="h-5 w-5" />
          <span className="font-medium">{t('cash.cashOnly')}</span>
        </div>

        {/* City tax */}
        <div className="mb-4 flex items-center justify-between rounded-lg bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCityTaxReady(!cityTaxReady)}
              className="focus:outline-none"
              aria-label={t('cash.confirm.cityTax')}
            >
              {cityTaxReady ? (
                <CheckCircle2 className="h-6 w-6 text-success" />
              ) : (
                <Circle className="h-6 w-6 text-muted-foreground" />
              )}
            </button>
            <div>
              <p className="font-medium text-foreground">{t('cash.cityTax.label')}</p>
              <p className="text-xs text-muted-foreground">{t('cash.cityTax.perNight')}</p>
            </div>
          </div>
          <span className="text-lg font-semibold text-foreground">
            €{cityTaxAmount.toFixed(2)}
          </span>
        </div>

        {/* Keycard deposit */}
        <div className="flex items-center justify-between rounded-lg bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDepositReady(!depositReady)}
              className="focus:outline-none"
              aria-label={t('cash.confirm.deposit')}
            >
              {depositReady ? (
                <CheckCircle2 className="h-6 w-6 text-success" />
              ) : (
                <Circle className="h-6 w-6 text-muted-foreground" />
              )}
            </button>
            <div>
              <p className="font-medium text-foreground">{t('cash.deposit.label')}</p>
              <p className="text-xs text-muted-foreground">{t('cash.deposit.refundable')}</p>
            </div>
          </div>
          <span className="text-lg font-semibold text-foreground">
            €{depositAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between rounded-xl bg-foreground p-4 text-background">
        <span className="font-medium">{t('cash.total')}</span>
        <span className="text-2xl font-bold">€{totalAmount.toFixed(2)}</span>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-3 rounded-xl bg-info-soft p-4">
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-info-foreground" />
        <div className="text-sm text-info-foreground">
          <p>{t('cash.info.message')}</p>
        </div>
      </div>

      {/* Card payment note */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CreditCard className="h-4 w-4" />
        <span>{t('cash.cardNote')}</span>
      </div>

      {/* Confirm button */}
      <button
        type="button"
        onClick={handleConfirm}
        className={`
          flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium
          transition-colors
          ${
            allReady
              ? 'bg-success text-success-foreground hover:bg-success/90'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }
        `}
      >
        {allReady ? (
          <>
            <Check className="h-5 w-5" />
            {t('cash.done')}
          </>
        ) : (
          t('cash.confirmPartial')
        )}
      </button>
    </div>
  );
});

export default CashPrep;
