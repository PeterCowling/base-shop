"use client";

import { Card, CardContent } from "@/components/atoms/shadcn";
import { useTranslations } from "@acme/i18n";

type PendingSummaryPanelProps = {
  headingId: string;
};

export function PendingSummaryPanel({ headingId }: PendingSummaryPanelProps) {
  const t = useTranslations();
  return (
    <Card className="border border-border-3">
      <CardContent className="space-y-4">
        <h2
          id={headingId}
          tabIndex={-1}
          className="text-lg font-semibold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {t("Account requests")}
        </h2>
        <p className="text-sm text-foreground">
          {t(
            "Only administrators can approve new accounts. Reach out to an admin if someone is waiting for access."
          )}
        </p>
      </CardContent>
    </Card>
  );
}
