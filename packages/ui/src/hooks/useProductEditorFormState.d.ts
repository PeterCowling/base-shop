import type { Locale, ProductPublication } from "@platform-core/products";
import { type ChangeEvent, type FormEvent, type ReactElement } from "react";
export interface UseProductEditorFormReturn {
    product: ProductPublication;
    errors: Record<string, string[]>;
    saving: boolean;
    publishTargets: string[];
    setPublishTargets: (ids: string[]) => void;
    handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleSubmit: (e: FormEvent) => void;
    uploader: ReactElement;
}
export declare function useProductEditorFormState(init: ProductPublication, locales: readonly Locale[], onSave: (fd: FormData) => Promise<{
    product?: ProductPublication;
    errors?: Record<string, string[]>;
}>): UseProductEditorFormReturn;
//# sourceMappingURL=useProductEditorFormState.d.ts.map