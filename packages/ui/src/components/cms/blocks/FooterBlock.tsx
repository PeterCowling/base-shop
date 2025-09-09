import type { Locale } from "@acme/i18n/locales";
import { Footer, type FooterLink } from "../../organisms/Footer";
import type { LogoVariants } from "../../organisms/types";

interface Props {
  links?: FooterLink[];
  logoVariants?: LogoVariants;
  shopName: string;
  locale: Locale;
}

/** CMS wrapper for the Footer organism */
export default function FooterBlock({ links = [], logoVariants, shopName }: Props) {
  return <Footer links={links} logoVariants={logoVariants} shopName={shopName} />;
}
