import type { Locale } from "@acme/i18n/locales";
import { type NavSection } from "../../organisms/Header";
interface Props {
    nav?: NavSection[];
    logo?: string;
    locale: Locale;
}
/** CMS wrapper for the Header organism */
export default function HeaderBlock({ nav, logo, locale }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=HeaderBlock.d.ts.map