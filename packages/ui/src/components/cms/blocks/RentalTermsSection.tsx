"use client";

import React from "react";
import { useTranslations } from "@acme/i18n";

export interface RentalTermsSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  sku: string;
  termsVersion: string;
  onAdd?: (payload: {
    sku: string;
    termsVersion: string;
    insurance?: { selected: boolean; fee?: number };
    deposit?: number;
  }) => void;
}

export default function RentalTermsSection({ sku, termsVersion, onAdd, className, ...rest }: RentalTermsSectionProps) {
  const t = useTranslations();
  const [accepted, setAccepted] = React.useState(false);
  const [insurance, setInsurance] = React.useState(false);
  const [insuranceFee, setInsuranceFee] = React.useState<number | undefined>(undefined);
  const [deposit, setDeposit] = React.useState<number | undefined>(undefined);

  const LABEL_ADD_INSURANCE = t("rental.addInsurance") as string;
  const LABEL_FEE = t("rental.fee") as string;
  const LABEL_DEPOSIT = t("rental.deposit") as string;
  const labelAcceptTerms = (v: string) => t("rental.acceptTerms", { version: v }) as string;
  const LABEL_ADD_TO_CART = t("actions.addToCart") as string;

  const handleAdd = () => {
    if (!accepted) return;
    onAdd?.({ sku, termsVersion, insurance: { selected: insurance, fee: insuranceFee }, deposit });
  };

  return (
    <div className={className} {...rest}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input id="ins" type="checkbox" checked={insurance} onChange={(e) => setInsurance(e.target.checked)} />
          <label htmlFor="ins">{LABEL_ADD_INSURANCE}</label>
          {insurance && (
            <input
              type="number"
              placeholder={LABEL_FEE}
              className="ms-2 w-24 rounded border px-2 py-1"
              value={typeof insuranceFee === 'number' ? insuranceFee : ''}
              onChange={(e) => setInsuranceFee(e.target.value ? Number(e.target.value) : undefined)}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <label>{LABEL_DEPOSIT}</label>
          <input type="number" className="w-28 rounded border px-2 py-1" value={typeof deposit === 'number' ? deposit : ''} onChange={(e) => setDeposit(e.target.value ? Number(e.target.value) : undefined)} />
        </div>
        <div className="flex items-center gap-2">
          <input id="terms" type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          <label htmlFor="terms">{labelAcceptTerms(termsVersion)}</label>
        </div>
        <button type="button" onClick={handleAdd} disabled={!accepted} className="rounded bg-black px-3 py-1 text-white disabled:opacity-50 min-h-10 min-w-10">
          {LABEL_ADD_TO_CART}
        </button>
      </div>
    </div>
  );
}
