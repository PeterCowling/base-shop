import { useState } from "react";
import { useTranslation } from "react-i18next";
import type React from "react";
import { getEffectiveGuideStatus, toggleGuideStatus, type GuideStatus } from "@/utils/guideStatus";
import type { GuideKey } from "@/routes.guides-helpers";
import { IS_DEV } from "@/config/env";

type TranslationFn = (key: string, opts?: Record<string, unknown>) => string;

const identityTranslation: TranslationFn = (key) => key;

function isTranslationFn(value: unknown): value is TranslationFn {
  return typeof value === "function";
}

interface DevStatusPillProps {
  guideKey: GuideKey;
}

export default function DevStatusPill({ guideKey }: DevStatusPillProps): JSX.Element | null {
  const isDev = IS_DEV;
  const translation = useTranslation("guides");
  const maybeT = translation?.t;
  const t = isTranslationFn(maybeT) ? maybeT : identityTranslation;

  const pillBase =
    "absolute right-4 top-4 z-10 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold shadow-sm"; // i18n-exempt -- DX-000 [ttl=2026-12-31] CSS utility classes, non-UI

  const [current, setCurrent] = useState<GuideStatus>(() => getEffectiveGuideStatus(guideKey));
  const pillClass =
    current === "draft"
      ? `${pillBase} border-amber-300 bg-amber-100 text-amber-900`
      : current === "review"
      ? `${pillBase} border-sky-300 bg-sky-100 text-sky-900`
      : `${pillBase} border-emerald-300 bg-emerald-100 text-emerald-900`;

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const next = toggleGuideStatus(guideKey);
    setCurrent(next);
  };

  if (!isDev) return null;

  const title = t("dev.statusPill.title", { status: current });

  return (
    <button
      type="button"
      onClick={onClick}
      className={pillClass}
      title={title}
      data-test-id={"guide-status-pill" as const /* i18n-exempt -- DX-000 [ttl=2026-12-31] Test id attribute, non-UI */}
    >
      {current}
    </button>
  );
}
