"use client";

import { memo } from "react";
import { useTranslation } from "react-i18next";

const TOPICS = ["arrival", "inside", "sleeping", "sound", "bestFit"] as const;

function FitCheck() {
  const { t } = useTranslation("apartmentPage");

  return (
    <div className="rounded-2xl border border-brand-outline/30 bg-brand-surface/50 p-5 shadow-sm backdrop-blur-sm sm:p-6">
      <h3 className="mb-4 text-lg font-semibold text-brand-heading">
        {t("fitCheck.heading")}
      </h3>
      <dl className="space-y-3">
        {TOPICS.map((topic) => (
          <div key={topic} className="flex flex-col gap-0.5">
            <dt className="text-sm font-medium text-brand-primary">
              {t(`fitCheck.${topic}.label`)}
            </dt>
            <dd className="text-sm text-brand-text">
              {t(`fitCheck.${topic}.text`)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default memo(FitCheck);
