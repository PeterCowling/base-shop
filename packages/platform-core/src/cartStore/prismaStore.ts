import type { RentalLineItem, SKU } from "@acme/types";

import type { CartState } from "../cart";
import type { CartStore } from "../cartStore";
import { prisma } from "../db";

/**
 * Prisma/Neon-backed CartStore implementation.
 * Worker-safe: no filesystem, no in-process state.
 * Cart ID is generated internally (cuid) — matches CartStore interface contract.
 */
export class PrismaCartStore implements CartStore {
  constructor(private ttlSeconds: number) {}

  private expiresAt(): Date {
    return new Date(Date.now() + this.ttlSeconds * 1000);
  }

  async createCart(): Promise<string> {
    const record = await prisma.cart.create({
      data: {
        items: {},
        expiresAt: this.expiresAt(),
      },
    });
    return record.id;
  }

  async getCart(id: string): Promise<CartState> {
    const record = await prisma.cart.findUnique({ where: { id } });
    if (!record) return {};
    if (record.expiresAt < new Date()) {
      await prisma.cart.delete({ where: { id } }).catch(() => {});
      return {};
    }
    return (record.items ?? {}) as CartState;
  }

  async setCart(id: string, cart: CartState): Promise<void> {
    await prisma.cart.upsert({
      where: { id },
      create: {
        id,
        items: cart as object,
        expiresAt: this.expiresAt(),
      },
      update: {
        items: cart as object,
        expiresAt: this.expiresAt(),
      },
    });
  }

  async deleteCart(id: string): Promise<void> {
    await prisma.cart.delete({ where: { id } }).catch(() => {});
  }

  async incrementQty(
    id: string,
    sku: SKU,
    qty: number,
    size?: string,
    rental?: RentalLineItem
  ): Promise<CartState> {
    const current = await this.getCart(id);
    const key = size ? `${sku.id}:${size}` : sku.id;
    const line = current[key];
    const updated: CartState = {
      ...current,
      [key]: {
        sku,
        size,
        qty: (line?.qty ?? 0) + qty,
        rental: rental ?? line?.rental,
      },
    };
    await this.setCart(id, updated);
    return updated;
  }

  async setQty(id: string, skuId: string, qty: number): Promise<CartState | null> {
    const current = await this.getCart(id);
    const line = current[skuId];
    if (!line) return null;
    let updated: CartState;
    if (qty === 0) {
      const { [skuId]: _removed, ...rest } = current;
      updated = rest;
    } else {
      updated = { ...current, [skuId]: { ...line, qty } };
    }
    await this.setCart(id, updated);
    return updated;
  }

  async removeItem(id: string, skuId: string): Promise<CartState | null> {
    const current = await this.getCart(id);
    if (!(skuId in current)) return null;
    const { [skuId]: _removed, ...updated } = current;
    await this.setCart(id, updated);
    return updated;
  }
}
