/// <reference types="react" />
import type { Locale, ProductPublication } from "@platform-core/products";
interface Props {
    locales: readonly Locale[];
    product: ProductPublication;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}
declare function MultilingualFieldsInner({ locales, product, onChange }: Props): import("react").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof MultilingualFieldsInner>;
export default _default;
