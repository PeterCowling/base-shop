import * as React from "react";
import { cn } from "../../utils/style";
import type { OrderStep } from "../organisms/OrderTrackingTimeline";
import { OrderTrackingTimeline } from "../organisms/OrderTrackingTimeline";

export interface OrderTrackingTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  orderId: string;
  shippingSteps: OrderStep[];
  returnSteps?: OrderStep[];
  /** Optional shipping address to display */
  address?: string;
}

export function OrderTrackingTemplate({
  orderId,
  shippingSteps,
  returnSteps,
  address,
  className,
  ...props
}: OrderTrackingTemplateProps) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      <h2 className="text-xl font-semibold">Order Tracking</h2>
      <p>
        Reference<span className="font-mono"> {orderId}</span>
      </p>
      {address && (
        <p className="text-muted-foreground text-sm">Shipping to {address}</p>
      )}
      <OrderTrackingTimeline
        shippingSteps={shippingSteps}
        returnSteps={returnSteps}
      />
    </div>
  );
}
