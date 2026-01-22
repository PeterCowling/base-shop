import type { Locale } from "@acme/i18n/locales";
import { type FooterLink } from "@acme/ui/components/organisms/Footer";
import type { LogoVariants } from "@acme/ui/components/organisms/types";
interface Props {
    links?: FooterLink[];
    logoVariants?: LogoVariants;
    shopName: string;
    locale: Locale;
}
/** CMS wrapper for the Footer organism */
export default function FooterBlock({ links, logoVariants, shopName }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=FooterBlock.d.ts.map