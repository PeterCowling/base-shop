import type { Currency } from "@platform-core/contexts/CurrencyContext";

import { readJson, writeJson } from "./storage";

export type XaOrderLine = {
  skuId: string;
  title: string;
  size?: string;
  qty: number;
  unitPrice: number;
};

export type XaOrder = {
  id: string;
  number: string;
  email: string;
  currency: Currency;
  status: "Processing" | "Shipped";
  createdAt: string;
  lines: XaOrderLine[];
};

const ORDERS_KEY = "XA_ORDERS_V1";

function createOrderId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
}

function createOrderNumber() {
  return `${Math.floor(1000000 + Math.random() * 9000000)}`; // i18n-exempt -- XA-0020: demo order number format
}

export function readOrders(): XaOrder[] {
  const raw = readJson<unknown>(ORDERS_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.filter((o): o is XaOrder => Boolean(o && typeof o === "object"));
}

export function writeOrders(orders: XaOrder[]) {
  writeJson(ORDERS_KEY, orders);
}

export function createOrder(input: {
  email: string;
  currency: Currency;
  lines: XaOrderLine[];
}): XaOrder {
  const order: XaOrder = {
    id: createOrderId(),
    number: createOrderNumber(),
    email: input.email,
    currency: input.currency,
    status: "Processing",
    createdAt: new Date().toISOString(),
    lines: input.lines,
  };
  const orders = readOrders();
  writeOrders([order, ...orders]);
  return order;
}

export function findOrderByNumber(orderNumber: string): XaOrder | null {
  const q = orderNumber.trim();
  if (!q) return null;
  return readOrders().find((o) => o.number === q) ?? null;
}

export function findOrdersByNumberAndEmail(orderNumber: string, email: string): XaOrder[] {
  const q = orderNumber.trim();
  const e = email.trim().toLowerCase();
  if (!q || !e) return [];
  return readOrders().filter(
    (o) => o.number === q && o.email.trim().toLowerCase() === e,
  );
}

export function orderTotal(order: XaOrder) {
  return order.lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0);
}

