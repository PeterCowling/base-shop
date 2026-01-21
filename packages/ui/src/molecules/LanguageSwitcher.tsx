// Copied from src/components/header/LanguageSwitcher.tsx
import { memo } from "react";

import { useModal } from "@acme/ui/context/ModalContext";
import { useCurrentLanguage } from "@acme/ui/hooks/useCurrentLanguage";
import { useTheme } from "@acme/ui/hooks/useTheme";
import type { AppLanguage } from "@acme/ui/i18n.config";

const LABELS: Record<AppLanguage, string> = {
  de: "Deutsch",
  en: "English",
  es: "Español",
  fr: "Français",
  it: "Italiano",
  ja: "日本語",
  ko: "한국어",
  pt: "Português",
  ru: "Русский",
  zh: "中文",
  ar: "العربية",
  hi: "हिन्दी",
  vi: "Tiếng Việt",
  pl: "Polski",
  sv: "Svenska",
  no: "Norsk",
  da: "Dansk",
  hu: "Magyar",
};

const LANGUAGE_BUTTON_TEST_ID = "language-button";

interface Props {
  closeMenu?: () => void;
}

function LanguageSwitcher({ closeMenu }: Props): React.JSX.Element {
  const { openModal } = useModal();
  const lang = useCurrentLanguage();
  const { theme } = useTheme();

  const handleClick = (): void => {
    closeMenu?.();
    openModal("language");
  };

  const themeClass = theme === "dark" ? "lang-dark" : "lang-light";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`lang-option lang-pill ${themeClass}`}
      data-testid={LANGUAGE_BUTTON_TEST_ID}
    >
      {LABELS[lang] ?? lang.toUpperCase()}
    </button>
  );
}

export { LanguageSwitcher };
export default memo(LanguageSwitcher);
