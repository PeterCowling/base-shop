import { buildCheckoutMetadata } from '../metadata';

describe('buildCheckoutMetadata', () => {
  const base = {
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
      sizes: 'M,L',
      clientIp: '203.0.113.1',
      extra: { foo: 'bar' },
    });

    expect(result.sizes).toBe('M,L');
    expect(result.client_ip).toBe('203.0.113.1');
    expect(result.foo).toBe('bar');
  });

  test('omits optional keys when not provided', () => {
    const result = buildCheckoutMetadata(base);

    expect(result).not.toHaveProperty('sizes');
    expect(result).not.toHaveProperty('client_ip');
    expect(result).not.toHaveProperty('foo');
  });
});
