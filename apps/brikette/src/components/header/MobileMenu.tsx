import { MobileMenu as UiMobileMenu } from "@acme/ui/organisms/MobileMenu";

import { buildExperienceNavItems } from "@/config/experienceDropdownItems";
import { buildHowToGetHereNavItems } from "@/config/howToGetHereDropdownItems";
import type { AppLanguage } from "@/i18n.config";

function MobileMenu({
  lang,
  menuOpen,
  setMenuOpen,
  bannerHeight,
}: {
  lang?: AppLanguage;
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  bannerHeight?: number;
}) {
  const resolvedLang = lang ?? ("en" as AppLanguage);
  const experienceNavItems = buildExperienceNavItems(resolvedLang);
  const howToGetHereNavItems = buildHowToGetHereNavItems(resolvedLang);

  return (
    <UiMobileMenu
      lang={lang}
      menuOpen={menuOpen}
      setMenuOpen={setMenuOpen}
      bannerHeight={bannerHeight}
      experienceNavItems={experienceNavItems}
      howToGetHereNavItems={howToGetHereNavItems}
    />
  );
}

export default MobileMenu;
export { MobileMenu };
