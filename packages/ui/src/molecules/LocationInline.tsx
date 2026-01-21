import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { FallbackLng, FallbackLngObjList } from "i18next";
import { Bus, MapPin } from "lucide-react";

import { useModal } from "@acme/ui/context/ModalContext";

function LocationInline({ lang }: { lang?: string }): JSX.Element {
  const { t, i18n } = useTranslation("modals", { lng: lang });
  const { openModal } = useModal();
  const resolveText = useCallback(
    (key: string) => {
      const translated = t(key);
      if (translated && translated !== key) {
        return translated;
      }

      if (!i18n) {
        return key;
      }

      const fallbackConfig = i18n.options?.fallbackLng;
      const fallbackLng = (() => {
        if (typeof lang === "string" && lang.trim()) {
          return lang;
        }
        if (Array.isArray(fallbackConfig) && fallbackConfig.length > 0) {
          return fallbackConfig[0];
        }
        if (typeof fallbackConfig === "string" && fallbackConfig) {
          return fallbackConfig;
        }
        if (isFallbackObject(fallbackConfig) && Array.isArray(fallbackConfig.default)) {
          const [first] = fallbackConfig.default;
          if (typeof first === "string" && first.trim()) {
            return first;
          }
        }
        if (i18n.language) {
          return i18n.language;
        }
        if (Array.isArray(i18n.languages) && i18n.languages.length > 0) {
          return i18n.languages[0];
        }
        return undefined;
      })();

      if (!fallbackLng) {
        return key;
      }

      const fallbackResource = i18n.getResource(fallbackLng, "modals", key);
      return typeof fallbackResource === "string" ? fallbackResource : key;
    },
    [i18n, lang, t],
  );
  const openMap = useCallback(() => {
    openModal("location");
  }, [openModal]);

  const proximity = resolveText("location.nearbyBusCompact");

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
      <span className="inline-flex items-center gap-1 text-brand-text/80">
        <Bus className="size-4 text-brand-primary" aria-hidden />
        {proximity}
      </span>
      <button
        type="button"
        onClick={openMap}
        className="inline-flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-full bg-brand-surface px-3 py-1 text-xs font-medium text-brand-primary transition-colors hover:bg-brand-primary/10 focus-visible:ring-1 focus-visible:ring-brand-primary/30"
      >
        <MapPin className="size-3.5" aria-hidden />
        {resolveText("getDirections")}
      </button>
    </div>
  );
}

type FallbackConfig = FallbackLng | false | undefined;

function isFallbackObject(value: FallbackConfig): value is FallbackLngObjList {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export default memo(LocationInline);
export { LocationInline };
