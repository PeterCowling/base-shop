import type { Locale, ProductPublication } from "@platform-core/products";
interface BaseProps {
    /** Current product snapshot (all locales) */
    product: ProductPublication;
    /** Called with FormData → resolves to updated product or errors */
    onSave(fd: FormData): Promise<{
        product?: ProductPublication;
        errors?: Record<string, string[]>;
    }>;
    /** Locales enabled for the current shop */
    locales: readonly Locale[];
}
export default function ProductEditorForm({ product: init, onSave, locales, }: BaseProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ProductEditorForm.d.ts.map