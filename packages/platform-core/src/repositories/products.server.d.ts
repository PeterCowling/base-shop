import "server-only";

import type { ProductPublication } from "../products/index";

export declare function readRepo<T = ProductPublication>(shop: string): Promise<T[]>;
export declare function writeRepo<T = ProductPublication>(shop: string, catalogue: T[]): Promise<void>;
export declare function getProductById<T extends {
    id: string;
} = ProductPublication>(shop: string, id: string): Promise<T | null>;
export declare function updateProductInRepo<T extends {
    id: string;
    row_version: number;
} = ProductPublication>(shop: string, patch: Partial<T> & {
    id: string;
}): Promise<T>;
export declare function deleteProductFromRepo<T extends {
    id: string;
} = ProductPublication>(shop: string, id: string): Promise<void>;
export declare function duplicateProductInRepo<T extends ProductPublication = ProductPublication>(shop: string, id: string): Promise<T>;
