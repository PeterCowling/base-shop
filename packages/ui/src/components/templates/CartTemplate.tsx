"use client";
import type { CartLine, CartState } from "@acme/platform-core/cart";
import Image from "next/image";
import * as React from "react";
import { cn } from "../../utils/style";
import { Price } from "../atoms/Price";
import { QuantityInput } from "../molecules/QuantityInput";
import { useTranslations } from "@acme/i18n";
import { Inline } from "../atoms/primitives";

export interface CartTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  cart: CartState;
  onQtyChange?: (id: string, qty: number) => void;
  onRemove?: (id: string) => void;
}

export function CartTemplate({
  cart,
  onQtyChange,
  onRemove,
  className,
  ...props
}: CartTemplateProps) {
  const t = useTranslations();
  // i18n-exempt: DS token literals; not user-visible
  const emptyClass = "p-8 text-center"; // i18n-exempt: class names
  const CART_EMPTY_KEY = "cart.empty"; // i18n-exempt: translation key
  const dangerToken = "--color-danger"; // i18n-exempt: DS token literal
  const mutedToken = "--color-muted"; // i18n-exempt: DS token literal
  const lines = (Object.entries(cart) as [string, CartLine][]).map(
    ([id, line]) => ({ id, ...line })
  );
  const subtotal = lines.reduce(
    (s, l) => s + (l.sku.price ?? 0) * l.qty,
    0,
  );
  const deposit = lines.reduce((s, l) => s + (l.sku.deposit ?? 0) * l.qty, 0);

  if (!lines.length) {
    return (
      <p className={cn(emptyClass, className)}>
        {/* i18n-exempt: translation key usage; no hardcoded user copy */}
        {t(CART_EMPTY_KEY)}
      </p>
    );
  }

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <h2 className="text-xl font-semibold">{t("cart.title")}</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-start">
            <th className="py-2">{t("order.item")}</th>
            <th>{t("order.qty")}</th>
            <th className="text-end">{t("order.price")}</th>
            {onRemove && <th className="sr-only">{t("actions.remove")}</th>}
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const media = line.sku.media?.[0];
            return (
              <tr key={line.id} className="border-b last:border-0">
                <td className="py-2">
                  <Inline gap={4} alignY="center">
                    {media && (
                      <div className="relative hidden h-12 w-12 sm:block">
                        {media.type === "image" ? (
                          <Image
                            src={media.url}
                            alt={line.sku.title ?? ""}
                            fill
                            sizes="3rem"
                            className="rounded-md object-cover"
                          />
                        ) : (
                          <video
                            src={media.url}
                            className="h-full w-full rounded-md object-cover"
                            data-aspect="1/1"
                            muted
                            playsInline
                          />
                        )}
                      </div>
                    )}
                    {line.sku.title}
                    {line.size && (
                      <span className="ms-1 text-xs text-muted" data-token={mutedToken}>
                        {/* i18n-exempt: decorative parentheses for size suffix formatting */}
                        {"("}
                        {line.size}
                        {")"}
                      </span>
                    )}
                  </Inline>
                </td>
                <td>
                  {onQtyChange ? (
                    <QuantityInput
                      value={line.qty}
                      onChange={(v) => onQtyChange(line.id, v)}
                      className="justify-center"
                    />
                  ) : (
                    <Inline className="justify-center">
                      <span className="min-w-6 text-center">{line.qty}</span>
                    </Inline>
                  )}
                </td>
                <td className="text-end">
                  <Price amount={(line.sku.price ?? 0) * line.qty} />
                </td>
                {onRemove && (
                  <td className="text-end">
                    {/* i18n-exempt: DS token/classnames below are not user-visible copy */}
                    <button
                      type="button"
                      onClick={() => onRemove(line.id)}
                      className="text-danger hover:underline inline-flex items-center justify-center min-h-10 min-w-10"
                      data-token={dangerToken}
                    >
                      {t("actions.remove")}
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td />
            <td className="py-2">{t("order.deposit")}</td>
            <td className="text-end">
              <Price amount={deposit} />
            </td>
            {onRemove && <td />}
          </tr>
          <tr>
            <td />
            <td className="py-2 font-semibold">{t("order.total")}</td>
            <td className="text-end font-semibold">
              <Price amount={subtotal + deposit} />
            </td>
            {onRemove && <td />}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
