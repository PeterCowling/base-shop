import { buildCheckoutMetadata } from '../metadata';

describe('buildCheckoutMetadata', () => {
  const base = {
    shopId: 'shop',
    subtotal: 100,
    depositTotal: 50,
    rentalDays: 3,
    discount: 0,
    currency: 'USD',
    taxRate: 0.2,
    taxAmount: 20,
  };

  test('includes optional keys when provided', () => {
    const result = buildCheckoutMetadata({
      ...base,
      orderId: "order_123",
      orderNumber: "A-1001",
      internalCustomerId: "cust_internal",
      stripeCustomerId: "cus_stripe",
      cartId: 'cart_123',
      sizes: 'M,L',
      clientIp: '203.0.113.1',
      taxMode: "static_rates",
      environment: "test",
      inventoryReservationId: "hold_123",
      extra: { foo: 'bar' },
    });

    expect(result.shop_id).toBe('shop');
    expect(result.cart_id).toBe('cart_123');
    expect(result.order_id).toBe("order_123");
    expect(result.order_number).toBe("A-1001");
    expect(result.internal_customer_id).toBe("cust_internal");
    expect(result.stripe_customer_id).toBe("cus_stripe");
    expect(result.sizes).toBe('M,L');
    expect(result.client_ip).toBe('203.0.113.1');
    expect(result.tax_mode).toBe("static_rates");
    expect(result.environment).toBe("test");
    expect(result.inventory_reservation_id).toBe("hold_123");
    expect(result.foo).toBe('bar');
  });

  test('omits optional keys when not provided', () => {
    const result = buildCheckoutMetadata(base);

    expect(result).not.toHaveProperty('sizes');
    expect(result).not.toHaveProperty('client_ip');
    expect(result).not.toHaveProperty('foo');
  });

  test('filters legacy and identity metadata overrides', () => {
    const result = buildCheckoutMetadata({
      ...base,
      internalCustomerId: "cust_internal",
      stripeCustomerId: "cus_stripe",
      extra: {
        internal_customer_id: "override",
        stripe_customer_id: "override",
        customerId: "legacy",
        customer_id: "legacy",
      },
    });

    expect(result.internal_customer_id).toBe("cust_internal");
    expect(result.stripe_customer_id).toBe("cus_stripe");
    expect(result).not.toHaveProperty("customerId");
    expect(result).not.toHaveProperty("customer_id");
  });
});
