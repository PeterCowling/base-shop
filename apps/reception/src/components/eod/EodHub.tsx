"use client";

import { memo, useState } from "react";

import { Button } from "@acme/design-system/atoms";
import { Inline } from "@acme/design-system/primitives";

import EodChecklistContent from "@/components/eodChecklist/EodChecklistContent";
import EndOfDayPacket from "@/components/reports/EndOfDayPacket";

type Tab = "checklist" | "report";

const TABS: { id: Tab; label: string }[] = [
  { id: "checklist", label: "Checklist" },
  { id: "report", label: "Report" },
];

const EodHub = memo(function EodHub() {
  const [activeTab, setActiveTab] = useState<Tab>("checklist");

  return (
    <>
      <Inline className="border-b border-border">
        {TABS.map((tab) => (
          <Button
            compatibilityMode="passthrough"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </Inline>
      {activeTab === "checklist" && <EodChecklistContent />}
      {activeTab === "report" && <EndOfDayPacket />}
    </>
  );
});

export default EodHub;
