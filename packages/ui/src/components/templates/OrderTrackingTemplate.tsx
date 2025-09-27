import * as React from "react";
import { cn } from "../../utils/style";
import { useTranslations } from "@acme/i18n";
import type { OrderStep } from "../organisms/OrderTrackingTimeline";
import { OrderTrackingTimeline } from "../organisms/OrderTrackingTimeline";

export interface OrderTrackingTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  orderId: string;
  steps: OrderStep[];
  /** Optional shipping address to display */
  address?: string;
}

export function OrderTrackingTemplate({
  orderId,
  steps,
  address,
  className,
  ...props
}: OrderTrackingTemplateProps) {
  const t = useTranslations();
  return (
    <div className={cn("space-y-6", className)} {...props}>
      <h2 className="text-xl font-semibold">{t("order.tracking.title")}</h2>
      <p>
        {t("order.reference")}<span className="font-mono"> {orderId}</span>
      </p>
      {address && (
        <p className="text-muted-foreground text-sm">
          {t("order.shippingTo")} {address}
        </p>
      )}
      <OrderTrackingTimeline steps={steps} />
    </div>
  );
}
