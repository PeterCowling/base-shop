import type { Locale } from "@acme/i18n";
import type { MediaItem } from "@acme/types";
interface ProductPublication {
    id: string;
    shop: string;
    title: Record<Locale, string>;
    description: Record<Locale, string>;
    price: number;
    media: MediaItem[];
}
import { type ChangeEvent, type FormEvent, type ReactElement } from "react";
export type ProductWithVariants = ProductPublication & {
    variants: Record<string, string[]>;
};
export interface ProductSaveResult {
    product?: ProductPublication & {
        variants?: Record<string, string[]>;
    };
    errors?: Record<string, string[]>;
}
export interface UseProductEditorFormReturn {
    product: ProductWithVariants;
    errors: Record<string, string[]>;
    saving: boolean;
    publishTargets: string[];
    setPublishTargets: (ids: string[]) => void;
    handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleSubmit: (e: FormEvent) => void;
    uploader: ReactElement;
    removeMedia: (index: number) => void;
    moveMedia: (from: number, to: number) => void;
    addVariantValue: (attr: string) => void;
    removeVariantValue: (attr: string, index: number) => void;
}
export declare function useProductEditorFormState(init: ProductPublication & {
    variants?: Record<string, string[]>;
}, locales: readonly Locale[], onSave: (fd: FormData) => Promise<ProductSaveResult>): UseProductEditorFormReturn;
export {};
//# sourceMappingURL=useProductEditorFormState.d.ts.map