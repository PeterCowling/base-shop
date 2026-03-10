import { DesktopHeader as UiDesktopHeader } from "@acme/ui/organisms/DesktopHeader";

import { buildExperienceNavItems } from "@/config/experienceDropdownItems";
import { buildHowToGetHereNavItems } from "@/config/howToGetHereDropdownItems";
import type { AppLanguage } from "@/i18n.config";

function DesktopHeader({
  lang,
  primaryCtaHref,
  onPrimaryCtaClick,
}: {
  lang?: AppLanguage;
  primaryCtaHref?: string;
  onPrimaryCtaClick?: () => boolean | void;
}) {
  const resolvedLang = lang ?? ("en" as AppLanguage);
  const experienceNavItems = buildExperienceNavItems(resolvedLang);
  const howToGetHereNavItems = buildHowToGetHereNavItems(resolvedLang);

  return (
    <UiDesktopHeader
      lang={resolvedLang}
      primaryCtaHref={primaryCtaHref}
      onPrimaryCtaClick={onPrimaryCtaClick}
      experienceNavItems={experienceNavItems}
      howToGetHereNavItems={howToGetHereNavItems}
    />
  );
}

export default DesktopHeader;
export { DesktopHeader };
