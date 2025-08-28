import type { ProductPublication } from "@acme/types";
import type { Locale } from "@acme/i18n";
interface Props {
    locales: readonly Locale[];
    /** Accept only the translated fields needed by this component */
    product: Pick<ProductPublication, "title" | "description">;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}
declare function MultilingualFieldsInner({ locales, product, onChange }: Props): import("react/jsx-runtime").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof MultilingualFieldsInner>;
export default _default;
