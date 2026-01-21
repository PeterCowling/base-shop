import type { ProductPublication } from "@acme/types";
import { ReactElement } from "react";
interface Props {
    shop: string;
    rows: ProductPublication[];
    isAdmin: boolean;
    sellability?: Record<string, {
        state: "sellable" | "needs_attention";
        issues: string[];
        stock: number;
    }>;
    /**
     * Callback that duplicates a product on the server.
     * Provided by the host application (e.g. `apps/cms`).
     */
    onDuplicate: (shop: string, productId: string) => void | Promise<void>;
    /**
     * Callback that deletes a product on the server.
     * Provided by the host application (e.g. `apps/cms`).
     */
    onDelete: (shop: string, productId: string) => void | Promise<void>;
}
declare function ProductsTableBase({ shop, rows, isAdmin, onDuplicate, onDelete, }: Props): ReactElement;
declare const _default: import("react").MemoExoticComponent<typeof ProductsTableBase>;
export default _default;
