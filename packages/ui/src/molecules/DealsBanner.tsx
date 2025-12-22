/* ---------------------------------------------------------------------------
   Promotional banner shown at the top of the deals page
--------------------------------------------------------------------------- */
import { useSetBannerRef } from "@/context/NotificationBannerContext";
import enDeals from "@/locales/en/dealsPage.json";
import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";

type TranslationParams = Record<string, string | number>;

const normalizeWhitespace = (value: string): string =>
  value
    .replace(/\s+/g, " ")
    .replace(/\s+([!?,.:;])/g, "$1")
    .trim();

const interpolateTemplate = (
  template: string,
  params?: TranslationParams
): string => {
  if (typeof template !== "string" || template.length === 0) {
    return "";
  }

  if (!params) {
    return template;
  }

  const interpolated = template.replace(/{{\s*(\w+)\s*}}/g, (_match, token: string) => {
    const value = params[token];
    if (value === null || value === undefined) {
      return "";
    }
    return String(value);
  });

  return normalizeWhitespace(interpolated);
};

interface DealsBannerProps {
  beds: number;
  time: string;
  lang?: string;
}

function DealsBanner({ beds, time, lang }: DealsBannerProps): JSX.Element {
  const { t } = useTranslation("dealsPage", { lng: lang });
  const { t: tEn } = useTranslation("dealsPage", { lng: "en" });
  const setBannerRef = useSetBannerRef();

  const ft = useCallback(
    (key: string, fallbackTemplate: string, options?: TranslationParams) => {
      const raw = t(key, options);
      const normalised = (value: unknown): string | null => {
        if (typeof value === "string" && value.length > 0 && value !== key && !/{{\s*\w+\s*}}/.test(value)) {
          return value;
        }
        return null;
      };

      const resolved = normalised(raw) ?? normalised(tEn(key, options));
      if (resolved) {
        return resolved;
      }

      const fallback = interpolateTemplate(fallbackTemplate, options);
      return fallback.length > 0 ? fallback : key;
    },
    [t, tEn]
  );

  return (
    <div
      ref={setBannerRef}
      className="sticky top-0 flex w-full items-center justify-center bg-brand-primary px-6 py-3 text-brand-bg shadow-md motion-safe:animate-slide-down dark:text-brand-text"
    >
      <p className="text-center text-sm font-medium sm:text-base">
        {ft(
          "banner",
          enDeals.banner,
          {
            beds,
            time,
          }
        )}
      </p>
    </div>
  );
}

export default memo(DealsBanner);
export { DealsBanner };
