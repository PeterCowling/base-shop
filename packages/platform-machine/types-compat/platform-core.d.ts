// Types-compat declarations for @acme/platform-core paths used in platform-machine

declare module "@acme/platform-core/dataRoot" {
  export const dataRoot: string;
  export const DATA_ROOT: string;
  export function getDataPath(...segments: string[]): string;
  export function resolveDataRoot(shopId?: string): string;
}

declare module "@acme/platform-core/utils" {
  export function slugify(text: string): string;
  export function generateId(): string;
  export function formatDate(date: Date | string): string;
  export function recordMetric(name: string, tags?: Record<string, any>): void;
  export function logger(context: string): {
    info: (...args: any[]) => void;
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    debug: (...args: any[]) => void;
  };
}

declare module "@acme/platform-core/db" {
  export const db: {
    query: <T = any>(sql: string, params?: any[]) => Promise<T[]>;
    execute: (sql: string, params?: any[]) => Promise<any>;
    transaction: <T>(fn: () => Promise<T>) => Promise<T>;
    [k: string]: any;
  };
  export const prisma: {
    inventoryHold: {
      findMany: (args?: any) => Promise<any[]>;
      delete: (args: any) => Promise<any>;
      deleteMany: (args?: any) => Promise<any>;
      [k: string]: any;
    };
    [k: string]: any;
  };
  export function getDb(): typeof db;
  export function withTransaction<T>(fn: () => Promise<T>): Promise<T>;
}

declare module "@acme/platform-core/inventoryHolds" {
  export interface InventoryHold {
    id: string;
    sku: string;
    quantity: number;
    expiresAt: Date | string;
    sessionId?: string;
    [k: string]: any;
  }
  export function createHold(data: Partial<InventoryHold>): Promise<InventoryHold>;
  export function releaseHold(holdId: string): Promise<void>;
  export function releaseInventoryHold(holdId: string): Promise<void>;
  export function releaseExpiredHolds(): Promise<number>;
  export function getHold(holdId: string): Promise<InventoryHold | null>;
  export function getHoldsBySku(sku: string): Promise<InventoryHold[]>;
}

declare module "@acme/platform-core/repositories/rentalOrders.server" {
  export interface RentalOrder {
    id: string;
    deposit: number;
    sessionId: string;
    shop: string;
    startedAt: string;
    status?: "received" | "cleaning" | "repair" | "qa" | "available";
    expectedReturnDate?: string;
    returnDueDate?: string;
    returnReceivedAt?: string;
    lateFeeCharged?: number;
    depositReleased?: boolean;
    stripeCustomerId?: string;
    [k: string]: any;
  }
  export function getRentalOrder(id: string): Promise<RentalOrder | null>;
  export function listRentalOrders(shopId: string): Promise<RentalOrder[]>;
  export function createRentalOrder(data: Partial<RentalOrder>): Promise<RentalOrder>;
  export function updateRentalOrder(id: string, data: Partial<RentalOrder>): Promise<RentalOrder>;
  export function deleteRentalOrder(id: string): Promise<void>;
  export function findOverdueOrders(shopId: string): Promise<RentalOrder[]>;
  export function findOrdersForDepositRelease(shopId: string): Promise<RentalOrder[]>;
  export function readOrders(shopId: string): Promise<RentalOrder[]>;
  export function markLateFeeCharged(orderId: string, amount: number): Promise<void>;
  export function markRefunded(orderId: string): Promise<void>;
  export function markAvailable(orderId: string): Promise<void>;
  export function markCleaning(orderId: string): Promise<void>;
  export function markQa(orderId: string): Promise<void>;
  export function markReceived(orderId: string): Promise<void>;
  export function markRepair(orderId: string): Promise<void>;
}

declare module "@acme/platform-core/repositories/reverseLogisticsEvents.server" {
  export interface ReverseLogisticsEvent {
    id: string;
    orderId: string;
    eventType: string;
    timestamp: string;
    data?: Record<string, any>;
    [k: string]: any;
  }
  export function createEvent(data: Partial<ReverseLogisticsEvent>): Promise<ReverseLogisticsEvent>;
  export function getEvent(id: string): Promise<ReverseLogisticsEvent | null>;
  export function listEvents(orderId: string): Promise<ReverseLogisticsEvent[]>;
  export function processEvent(event: ReverseLogisticsEvent): Promise<void>;
  export function getUnprocessedEvents(): Promise<ReverseLogisticsEvent[]>;
}

declare module "@acme/platform-core/repositories/inventory.server" {
  export interface InventoryItem {
    sku: string;
    quantity: number;
    location?: string;
    [k: string]: any;
  }
  export const inventoryRepository: {
    get: (shopId: string) => Promise<InventoryItem[]>;
    update: (sku: string, quantity: number) => Promise<InventoryItem>;
    [k: string]: any;
  };
  export function getInventory(shopId: string): Promise<InventoryItem[]>;
  export function readInventory(shopId: string): Promise<InventoryItem[]>;
  export function updateInventory(sku: string, quantity: number): Promise<InventoryItem>;
  export function updateInventoryItem(sku: string, data: Partial<InventoryItem>): Promise<InventoryItem>;
}

declare module "@acme/platform-core/repositories/products.server" {
  export interface Product {
    id: string;
    sku?: string;
    title: string;
    price?: number;
    wearAndTearLimit?: number;
    maintenanceCycle?: number;
    [k: string]: any;
  }
  export function getProduct(id: string): Promise<Product | null>;
  export function listProducts(shopId: string): Promise<Product[]>;
  export function updateProduct(id: string, data: Partial<Product>): Promise<Product>;
  export function createProduct(data: Partial<Product>): Promise<Product>;
  export function deleteProduct(id: string): Promise<void>;
  export function readRepo(shopId: string): Promise<Product[]>;
}

declare module "@acme/platform-core/types/inventory" {
  import { z } from "zod";

  export interface InventoryItem {
    sku: string;
    quantity: number;
    location?: string;
    wearCount?: number;
    [k: string]: any;
  }
  export interface StockAdjustment {
    sku: string;
    delta: number;
    reason?: string;
    [k: string]: any;
  }
  export interface StockInflow {
    sku: string;
    quantity: number;
    source?: string;
    [k: string]: any;
  }
  export const inventoryItemSchema: z.ZodSchema<InventoryItem>;
  export const stockAdjustmentSchema: z.ZodSchema<StockAdjustment>;
  export function variantKey(variant: any): string;
}

declare module "@acme/platform-core/orders" {
  export interface Order {
    id: string;
    shop: string;
    status: string;
    items: any[];
    total: number;
    [k: string]: any;
  }
  export function getOrder(id: string): Promise<Order | null>;
  export function listOrders(shopId: string): Promise<Order[]>;
  export function createOrder(data: Partial<Order>): Promise<Order>;
  export function updateOrder(id: string, data: Partial<Order>): Promise<Order>;
  export function deleteOrder(id: string): Promise<void>;
}
