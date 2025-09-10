/**
 * Build the shared metadata object for both the checkout session and
 * payment intent.
 */
export const buildCheckoutMetadata = ({
  subtotal,
  depositTotal,
  returnDate,
  rentalDays,
  customerId,
  discount,
  coupon,
  currency,
  taxRate,
  taxAmount,
  clientIp,
  sizes,
  extra,
}: {
  subtotal: number;
  depositTotal: number;
  returnDate?: string;
  rentalDays: number;
  customerId?: string;
  discount: number;
  coupon?: string;
  currency: string;
  taxRate: number;
  taxAmount: number;
  clientIp?: string;
  sizes?: string;
  extra?: Record<string, string>;
}) => {
  const metadata = {
    subtotal: subtotal.toString(),
    depositTotal: depositTotal.toString(),
    returnDate: returnDate ?? "",
    rentalDays: rentalDays.toString(),
    ...(sizes ? { sizes } : {}),
    customerId: customerId ?? "",
    discount: discount.toString(),
    coupon: coupon ?? "",
    currency,
    taxRate: taxRate.toString(),
    taxAmount: taxAmount.toString(),
    ...(clientIp ? { client_ip: clientIp } : {}),
  };

  // Extra metadata keys are spread last so they can override defaults like `coupon`.
  return {
    ...metadata,
    ...(extra ?? {}),
  };
};

