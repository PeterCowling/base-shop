import type { Locale } from "@acme/i18n/locales";
import { type FooterLink } from "../../organisms/Footer";
interface Props {
    links?: FooterLink[];
    logo?: string;
    locale: Locale;
}
/** CMS wrapper for the Footer organism */
export default function FooterBlock({ links, logo }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=FooterBlock.d.ts.map