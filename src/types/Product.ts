// src/types/Product.ts
export interface Product {
  /** Unique SKU or database primary key */
  id: string;
  /** Display name shown in listings and PDP */
  name: string;
  /** Long-form marketing copy (Markdown allowed) */
  description: string;
  /** Unit price in the smallest currency unit (e.g. cents) */
  price: number;
  /** ISO-4217 currency code, e.g. “EUR” */
  currency: string;
  /** Publicly reachable image URL */
  image: string;
  /** Used for optimistic concurrency control (OCC) */
  row_version: number;
}
