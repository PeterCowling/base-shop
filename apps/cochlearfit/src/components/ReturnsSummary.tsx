"use client";

import React from "react";
import { useTranslations } from "@acme/i18n";

const ReturnsSummary = React.memo(function ReturnsSummary() {
  const t = useTranslations();

  return (
    <div className="rounded-3xl border border-border-1 bg-surface-2 p-4 text-sm text-muted-foreground">
      <div className="text-xs font-semibold uppercase tracking-widest text-foreground">
        {t("returns.summaryTitle") as string}
      </div>
      <ul className="mt-3 space-y-2">
        <li>{t("returns.summary1") as string}</li>
        <li>{t("returns.summary2") as string}</li>
        <li>{t("returns.summary3") as string}</li>
      </ul>
    </div>
  );
});

export default ReturnsSummary;