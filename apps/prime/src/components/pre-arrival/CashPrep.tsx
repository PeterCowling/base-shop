/**
 * CashPrep.tsx
 *
 * Component for displaying and confirming cash preparedness for check-in.
 * Shows city tax and keycard deposit amounts.
 */

import {
  ArrowLeft,
  Banknote,
  Check,
  CheckCircle2,
  Circle,
  CreditCard,
  Info,
} from 'lucide-react';
import { FC, memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
            className="mt-1 rounded-full p-2 hover:bg-gray-100"
            aria-label={t('cash.back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {t('cash.title')}
          </h2>
          <p className="mt-1 text-sm text-gray-600">{t('cash.subtitle')}</p>
        </div>
      </div>

      {/* Cash info card */}
      <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        <div className="mb-4 flex items-center gap-2 text-green-700">
          <Banknote className="h-5 w-5" />
          <span className="font-medium">{t('cash.cashOnly')}</span>
        </div>

        {/* City tax */}
        <div className="mb-4 flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCityTaxReady(!cityTaxReady)}
              className="focus:outline-none"
              aria-label={t('cash.confirm.cityTax')}
            >
              {cityTaxReady ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <Circle className="h-6 w-6 text-gray-300" />
              )}
            </button>
            <div>
              <p className="font-medium text-gray-900">{t('cash.cityTax.label')}</p>
              <p className="text-xs text-gray-500">{t('cash.cityTax.perNight')}</p>
            </div>
          </div>
          <span className="text-lg font-semibold text-gray-900">
            €{cityTaxAmount.toFixed(2)}
          </span>
        </div>

        {/* Keycard deposit */}
        <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDepositReady(!depositReady)}
              className="focus:outline-none"
              aria-label={t('cash.confirm.deposit')}
            >
              {depositReady ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <Circle className="h-6 w-6 text-gray-300" />
              )}
            </button>
            <div>
              <p className="font-medium text-gray-900">{t('cash.deposit.label')}</p>
              <p className="text-xs text-gray-500">{t('cash.deposit.refundable')}</p>
            </div>
          </div>
          <span className="text-lg font-semibold text-gray-900">
            €{depositAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between rounded-xl bg-gray-900 p-4 text-white">
        <span className="font-medium">{t('cash.total')}</span>
        <span className="text-2xl font-bold">€{totalAmount.toFixed(2)}</span>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-4">
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
        <div className="text-sm text-blue-800">
          <p>{t('cash.info.message')}</p>
        </div>
      </div>

      {/* Card payment note */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
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
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
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
