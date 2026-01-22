import type { Locale } from "@acme/i18n/locales";
import { Footer, type FooterLink } from "@acme/ui/components/organisms/Footer";
import type { LogoVariants } from "@acme/ui/components/organisms/types";

import SocialLinks, { type SocialLinksProps } from "./SocialLinks";

interface LinkGroup {
  title?: string;
  links?: FooterLink[];
}

interface Props {
  links?: FooterLink[];
  linkGroups?: LinkGroup[];
  socialLinks?: SocialLinksProps;
  logoVariants?: LogoVariants;
  shopName: string;
  locale: Locale;
}

/** CMS wrapper for the Footer organism */
export default function FooterBlock({
  links = [],
  linkGroups = [],
  socialLinks,
  logoVariants,
  shopName,
}: Props) {
  const groupedLinks = linkGroups.flatMap((g) => g.links ?? []);
  const footerLinks = groupedLinks.length ? groupedLinks : links;

  return (
    <div>
      <Footer links={footerLinks} logoVariants={logoVariants} shopName={shopName} />
      {socialLinks && <SocialLinks {...socialLinks} className="mt-4" />}
    </div>
  );
}
