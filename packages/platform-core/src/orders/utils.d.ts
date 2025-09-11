import "server-only";
import type { RentalOrder } from "@acme/types";
export type Order = RentalOrder;
export declare function normalize<T extends Order>(order: T): T;
