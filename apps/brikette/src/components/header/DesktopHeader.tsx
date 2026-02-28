import { DesktopHeader as UiDesktopHeader } from "@acme/ui/organisms/DesktopHeader";

import { buildExperienceNavItems } from "@/config/experienceDropdownItems";
import { buildHowToGetHereNavItems } from "@/config/howToGetHereDropdownItems";
import type { AppLanguage } from "@/i18n.config";

function DesktopHeader({
  lang,
  onPrimaryCtaClick,
}: {
  lang?: AppLanguage;
  onPrimaryCtaClick?: () => boolean | void;
}) {
  const resolvedLang = lang ?? ("en" as AppLanguage);
  const experienceNavItems = buildExperienceNavItems(resolvedLang);
  const howToGetHereNavItems = buildHowToGetHereNavItems(resolvedLang);

  return (
    <UiDesktopHeader
      lang={lang}
      onPrimaryCtaClick={onPrimaryCtaClick}
      experienceNavItems={experienceNavItems}
      howToGetHereNavItems={howToGetHereNavItems}
    />
  );
}

export default DesktopHeader;
export { DesktopHeader };
