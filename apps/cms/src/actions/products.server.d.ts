import type { ProductPublication } from "@platform-core/src/products";
export declare function createDraftRecord(shop: string): Promise<ProductPublication>;
export declare function createDraft(shop: string): Promise<void>;
export declare function updateProduct(shop: string, formData: FormData): Promise<{
    product?: ProductPublication;
    errors?: Record<string, string[]>;
}>;
export declare function duplicateProduct(shop: string, id: string): Promise<void>;
export declare function deleteProduct(shop: string, id: string): Promise<void>;
//# sourceMappingURL=products.server.d.ts.map