/* File: /src/types/bar/BarTypes.ts
   ------------------------------------------------------------------
   Expanded to include UnconfirmedSalesOrder for "unconfirmed" usage.
   ------------------------------------------------------------------ */

/* ------------------------------------------------------------------
   1) Screen Types
--------------------------------------------------------------------*/
export type ScreenType = "orderTaking" | "sales" | "comp";

/* ------------------------------------------------------------------
   2) Order / AggregatedOrder Types
--------------------------------------------------------------------*/
export interface Order {
  product: string;
  price: number;
}

export interface AggregatedOrder {
  product: string;
  price: number;
  count: number;
}

/* ------------------------------------------------------------------
   3) Product Types
--------------------------------------------------------------------*/
export type CategoryType =
  | "Sweet"
  | "Savory"
  | "Gelato"
  | "Coffee"
  | "Tea"
  | "Juices"
  | "Smoothies"
  | "Soda"
  | "Beer"
  | "Wine"
  | "Spritz"
  | "Mixed Drinks"
  | "Cocktails"
  | "Other";

/**
 * A single product row tuple:
 * [ productName, displayScreenType, price, colorHex ]
 */
export type ProductRow = [string, string, number, string];

/**
 * The entire dataset, keyed by category ID (1..15, etc.).
 * Each category has an array of ProductRow tuples.
 */
export type ProductsDataMap = Record<number, ProductRow[]>;

export interface Product {
  name: string;
  price: number;
  bgColor: string;
}

/**
 * Props for a ProductGrid that shows clickable product items.
 */
export interface ProductGridProps {
  products: Product[];
  onAddProduct: (name: string, price: number) => void;
}

/* ------------------------------------------------------------------
   4) Sales Orders (full data objects in DB)
--------------------------------------------------------------------*/
export interface SalesOrderItem {
  id?: string;
  product: string;
  price?: number;
  count: number;
  lineType?: "bds" | "kds"; // Optional line-type logic
}

export interface SalesOrder {
  orderKey: string; // e.g. Firebase key
  confirmed: boolean;
  bleepNumber: string; // e.g. "go" or "2"
  userName: string; // who placed the order
  time: string; // "HH:MM"
  paymentMethod: string; // "cash" | "card" | ...
  items: SalesOrderItem[];
}

/* ------------------------------------------------------------------
   5) Additional structures
--------------------------------------------------------------------*/
export interface SalesItem {
  product: string;
  price: number;
  orderNum?: string;
  timestamp?: string;
}

export interface TicketHeader {
  orderNum: string;
  guestName?: string;
  time?: string;
  paymentMethod?: string;
  bleepNumber?: string;
  status?: string; // "pending", "cooking", "completed", etc.
}

export interface Ticket {
  header: TicketHeader;
  items: SalesItem[];
}

export interface BarData {
  sales?: Record<string, Ticket>;
  completed?: Record<string, Ticket>;
  preorders?: Record<string, Ticket>;
}

/* ------------------------------------------------------------------
   6) UnconfirmedSalesOrder
--------------------------------------------------------------------*/
/**
 * Minimal structure used for in‑progress, unconfirmed orders.
 * You might store this in your RTDB at '/barOrders/unconfirmed'.
 */
export interface UnconfirmedSalesOrder {
  confirmed: boolean;
  items: SalesOrderItem[];
}

/**
 * Backwards alias used by some older hooks.
 * Equivalent to UnconfirmedSalesOrder.
 */
export type BarOrder = UnconfirmedSalesOrder;
