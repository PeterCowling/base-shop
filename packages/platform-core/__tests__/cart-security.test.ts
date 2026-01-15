/**
 * Security Test Suite for Cart System
 *
 * Tests the critical security requirements implemented in the cart system:
 * - Price tampering protection
 * - Multi-shop isolation
 * - Cart migration from legacy to secure format
 * - Cookie security and shop binding
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { MemoryCartStore } from '../cartStore/memoryStore';
import { repriceCart, CheckoutValidationError } from '../checkout/reprice';
import { encodeCartCookie, decodeCartCookie } from '../cartCookie';
import type { CartState, CartStateSecure, CartLineSecure } from '../cart';
import { migrateCartState, isSecureCart } from '../cart/migrate';
import type { SKU } from '@acme/types';

// Mock SKU for testing
const mockSku: any = {
  id: 'test-sku-1',
  title: 'Test Product',
  price: 5000, // 50.00 in minor units
  deposit: 1000,
  stock: 10,
  sizes: [],
  slug: 'test-product',
  media: [],
  description: 'Test product',
  forSale: true,
  forRental: false,
};

describe('Cart Security', () => {
  describe('Price Trust Boundary', () => {
    it('should store only SKU IDs, not full SKU objects', async () => {
      const { MemoryCartStore } = await import('../cartStore/memoryStore');
      const store = new MemoryCartStore(3600);

      const cartId = await store.createCart();
      const sku = { id: 'test-sku', price: 1000, deposit: 500, stock: 10 } as any;

      // Add item to cart
      const cart = await store.incrementQty(cartId, sku, 1);

      // Verify only ID is stored, not full SKU
      const line = Object.values(cart)[0];
      expect(line).toHaveProperty('skuId', 'test-sku-id');
      expect(line).not.toHaveProperty('sku');
    });
  });
});
