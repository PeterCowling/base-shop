"use client";

import * as React from "react";
import OrderSummary from "../../organisms/OrderSummary";

export interface CartSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  showPromo?: boolean;
  showGiftCard?: boolean;
  showLoyalty?: boolean;
}

export default function CartSection({ showPromo = true, showGiftCard = true, showLoyalty = false, className, ...rest }: CartSectionProps) {
  const [promo, setPromo] = React.useState("");
  const [gift, setGift] = React.useState("");
  const [loyalty, setLoyalty] = React.useState(false);
  return (
    <section className={className} {...rest}>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Your cart</h2>
          <OrderSummary />
        </div>
        <aside className="space-y-3">
          {showPromo && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Promo code</label>
              <div className="flex gap-2">
                <input value={promo} onChange={(e) => setPromo(e.target.value)} className="flex-1 rounded border px-2 py-1 text-sm" />
                <button type="button" className="rounded border px-3 py-1 text-sm">Apply</button>
              </div>
            </div>
          )}
          {showGiftCard && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Gift card</label>
              <div className="flex gap-2">
                <input value={gift} onChange={(e) => setGift(e.target.value)} className="flex-1 rounded border px-2 py-1 text-sm" />
                <button type="button" className="rounded border px-3 py-1 text-sm">Redeem</button>
              </div>
            </div>
          )}
          {showLoyalty && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={loyalty} onChange={(e) => setLoyalty(e.target.checked)} />
              Use loyalty points
            </label>
          )}
        </aside>
      </div>
    </section>
  );
}

