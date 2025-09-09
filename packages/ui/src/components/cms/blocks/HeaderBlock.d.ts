import type { Locale } from "@acme/i18n/locales";
import { type NavSection } from "../../organisms/Header";
import type { LogoVariants } from "../../organisms/types";
interface Props {
    nav?: NavSection[];
    logoVariants?: LogoVariants;
    shopName: string;
    locale: Locale;
}
/** CMS wrapper for the Header organism */
export default function HeaderBlock({ nav, logoVariants, shopName, locale }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=HeaderBlock.d.ts.map