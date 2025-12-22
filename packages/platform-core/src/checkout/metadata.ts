/**
 * Build the shared metadata object for both the checkout session and
 * payment intent.
 */
export const buildCheckoutMetadata = ({
  shopId,
  cartId,
  orderId,
  orderNumber,
  internalCustomerId,
  stripeCustomerId,
  subtotal,
  depositTotal,
  returnDate,
  rentalDays,
  discount,
  coupon,
  currency,
  taxRate,
  taxAmount,
  taxMode,
  environment,
  inventoryReservationId,
  clientIp,
  sizes,
  extra,
}: {
  shopId: string;
  cartId?: string;
  orderId?: string;
  orderNumber?: string;
  internalCustomerId?: string;
  stripeCustomerId?: string;
  subtotal: number;
  depositTotal: number;
  returnDate?: string;
  rentalDays: number;
  discount: number;
  coupon?: string;
  currency: string;
  taxRate: number;
  taxAmount: number;
  taxMode?: string;
  environment?: string;
  inventoryReservationId?: string;
  clientIp?: string;
  sizes?: string;
  extra?: Record<string, string>;
}) => {
  const metadata = {
    shop_id: shopId,
    cart_id: cartId ?? "",
    order_id: orderId ?? "",
    order_number: orderNumber ?? "",
    internal_customer_id: internalCustomerId ?? "",
    stripe_customer_id: stripeCustomerId ?? "",
    subtotal: subtotal.toString(),
    depositTotal: depositTotal.toString(),
    returnDate: returnDate ?? "",
    rentalDays: rentalDays.toString(),
    ...(sizes ? { sizes } : {}),
    discount: discount.toString(),
    coupon: coupon ?? "",
    currency,
    taxRate: taxRate.toString(),
    taxAmount: taxAmount.toString(),
    ...(taxMode ? { tax_mode: taxMode } : {}),
    ...(environment ? { environment } : {}),
    ...(inventoryReservationId
      ? { inventory_reservation_id: inventoryReservationId }
      : {}),
    ...(clientIp ? { client_ip: clientIp } : {}),
  };

  const extraMetadata = Object.fromEntries(
    Object.entries(extra ?? {}).filter(([key]) => {
      if (key === "customerId" || key === "customer_id") return false;
      if (key === "internalCustomerId" || key === "internal_customer_id") return false;
      if (key === "stripeCustomerId" || key === "stripe_customer_id") return false;
      return true;
    }),
  );

  // Extra metadata keys are spread last so they can override defaults like `coupon`.
  return {
    ...metadata,
    ...extraMetadata,
  };
};
