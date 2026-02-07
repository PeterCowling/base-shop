'use client';

import { Activity } from "lucide-react";

import { OwnerKpiTile } from "@acme/ui/components/hospitality/OwnerKpiTile";
import { StaffSignalBadgeGroup } from "@acme/ui/components/hospitality/StaffSignalBadgeGroup";

export default function HospitalityPreviewPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold text-brand-heading">
        Hospitality Theme Preview
      </h1>

      <section className="grid gap-4 md:grid-cols-2">
        <OwnerKpiTile
          label="Guest activation"
          value="72%"
          description="Last 7 days"
          icon={Activity}
          variant="success"
        />
        <StaffSignalBadgeGroup
          title="Signal bridge check"
          signals={[
            { id: "eta", label: "ETA shared", ready: true },
            { id: "cash", label: "Cash prepared", ready: false },
          ]}
        />
      </section>
    </main>
  );
}
