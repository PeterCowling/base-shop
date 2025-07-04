/// <reference types="react" />
import type { Locale, ProductPublication } from "@platform-core/products";
export interface UseProductEditorFormReturn {
    product: ProductPublication;
    errors: Record<string, string[]>;
    saving: boolean;
    publishTargets: string[];
    setPublishTargets: (ids: string[]) => void;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleSubmit: (e: React.FormEvent) => void;
    uploader: JSX.Element;
}
export declare function useProductEditorFormState(init: ProductPublication, locales: readonly Locale[], onSave: (fd: FormData) => Promise<{
    product?: ProductPublication;
    errors?: Record<string, string[]>;
}>): UseProductEditorFormReturn;
