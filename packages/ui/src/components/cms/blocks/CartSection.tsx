"use client";

import * as React from "react";
import OrderSummary from "../../organisms/OrderSummary";
import { Grid as GridPrimitive } from "../../atoms/primitives/Grid";
import { Button } from "../../atoms";
import { useTranslations } from "@acme/i18n";

export interface CartSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  showPromo?: boolean;
  showGiftCard?: boolean;
  showLoyalty?: boolean;
}

export default function CartSection({ showPromo = true, showGiftCard = true, showLoyalty = false, className, ...rest }: CartSectionProps) {
  const t = useTranslations();
  const [promo, setPromo] = React.useState("");
  const [gift, setGift] = React.useState("");
  const [loyalty, setLoyalty] = React.useState(false);
  return (
    <section className={className} {...rest}>
      <GridPrimitive className="mx-auto md:grid-cols-3" cols={1} gap={8}>
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">{t("Your cart")}</h2>
          <OrderSummary />
        </div>
        <aside className="space-y-3">
          {showPromo && (
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("Promo code")}</label>
              <div className="flex gap-2">
                <input value={promo} onChange={(e) => setPromo(e.target.value)} className="flex-1 rounded border px-2 py-1 text-sm" />
                <Button type="button" variant="outline">{t("Apply")}</Button>
              </div>
            </div>
          )}
          {showGiftCard && (
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("Gift card")}</label>
              <div className="flex gap-2">
                <input value={gift} onChange={(e) => setGift(e.target.value)} className="flex-1 rounded border px-2 py-1 text-sm" />
                <Button type="button" variant="outline">{t("Redeem")}</Button>
              </div>
            </div>
          )}
          {showLoyalty && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={loyalty} onChange={(e) => setLoyalty(e.target.checked)} />
              {t("Use loyalty points")}
            </label>
          )}
        </aside>
      </GridPrimitive>
    </section>
  );
}
