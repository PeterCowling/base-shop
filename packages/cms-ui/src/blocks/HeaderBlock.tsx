import type { Locale } from "@acme/i18n/locales";
import { Header, type NavSection } from "@acme/ui/components/organisms/Header";
import type { LogoVariants } from "@acme/ui/components/organisms/types";

interface Props {
  nav?: NavSection[];
  logoVariants?: LogoVariants;
  shopName: string;
  locale: Locale;
  showSearch?: boolean;
}

/** CMS wrapper for the Header organism */
export default function HeaderBlock({
  nav = [],
  logoVariants,
  shopName,
  locale,
  showSearch,
}: Props) {
  return (
    <Header
      nav={nav}
      logoVariants={logoVariants}
      shopName={shopName}
      locale={locale}
      showSearch={showSearch}
    />
  );
}
