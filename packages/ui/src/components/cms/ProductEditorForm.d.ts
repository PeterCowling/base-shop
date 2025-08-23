import type { Locale } from "@acme/platform-core/products";
import type { ProductWithVariants, ProductSaveResult } from "../../hooks/useProductEditorFormState";
interface BaseProps {
    /** Current product snapshot (all locales) */
    product: ProductWithVariants;
    /** Called with FormData → resolves to updated product or errors */
    onSave(fd: FormData): Promise<ProductSaveResult>;
    /** Locales enabled for the current shop */
    locales: readonly Locale[];
}
export default function ProductEditorForm({ product: init, onSave, locales, }: BaseProps): import("react/jsx-runtime").JSX.Element;
export {};
