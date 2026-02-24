'use client';

import { useTranslation } from "react-i18next";
import { Activity } from "lucide-react";

import { Section } from "@acme/design-system/atoms";
import { OwnerKpiTile } from "@acme/ui/components/hospitality/OwnerKpiTile";
import { StaffSignalBadgeGroup } from "@acme/ui/components/hospitality/StaffSignalBadgeGroup";

export default function HospitalityPreviewPage() {
  const { t } = useTranslation("hospitalityPreview");

  return (
    <main className="py-8">
      <Section width="constrained" padding="none" className="space-y-6 px-4">
        <h1 className="text-2xl font-semibold text-brand-heading">
          {t("title")}
        </h1>

        <section className="grid gap-4 md:grid-cols-2">
          <OwnerKpiTile
            label={t("guestActivation.label")}
            value="72%"
            description={t("guestActivation.description")}
            icon={Activity}
            variant="success"
          />
          <StaffSignalBadgeGroup
            title={t("signalBridge.title")}
            signals={[
              { id: "eta", label: t("signalBridge.etaShared"), ready: true },
              { id: "cash", label: t("signalBridge.cashPrepared"), ready: false },
            ]}
          />
        </section>
      </Section>
    </main>
  );
}
