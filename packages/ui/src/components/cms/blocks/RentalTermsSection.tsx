"use client";

import React from "react";

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
  const [accepted, setAccepted] = React.useState(false);
  const [insurance, setInsurance] = React.useState(false);
  const [insuranceFee, setInsuranceFee] = React.useState<number | undefined>(undefined);
  const [deposit, setDeposit] = React.useState<number | undefined>(undefined);

  const handleAdd = () => {
    if (!accepted) return;
    onAdd?.({ sku, termsVersion, insurance: { selected: insurance, fee: insuranceFee }, deposit });
  };

  return (
    <div className={className} {...rest}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input id="ins" type="checkbox" checked={insurance} onChange={(e) => setInsurance(e.target.checked)} />
          <label htmlFor="ins">Add insurance</label>
          {insurance && (
            <input
              type="number"
              placeholder="Fee"
              className="ms-2 w-24 rounded border px-2 py-1"
              value={typeof insuranceFee === 'number' ? insuranceFee : ''}
              onChange={(e) => setInsuranceFee(e.target.value ? Number(e.target.value) : undefined)}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <label>Deposit</label>
          <input type="number" className="w-28 rounded border px-2 py-1" value={typeof deposit === 'number' ? deposit : ''} onChange={(e) => setDeposit(e.target.value ? Number(e.target.value) : undefined)} />
        </div>
        <div className="flex items-center gap-2">
          <input id="terms" type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          <label htmlFor="terms">I accept rental terms (v{termsVersion})</label>
        </div>
        <button type="button" onClick={handleAdd} disabled={!accepted} className="rounded bg-black px-3 py-1 text-white disabled:opacity-50">
          Add to cart
        </button>
      </div>
    </div>
  );
}
