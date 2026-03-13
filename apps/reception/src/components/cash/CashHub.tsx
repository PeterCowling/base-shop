"use client";

import { memo, useState } from "react";

import SafeReconciliation from "@/components/safe/SafeReconciliation";
import ReconciliationWorkbench from "@/components/till/ReconciliationWorkbench";
import TillReconciliation from "@/components/till/Till";
import { SafeDataProvider } from "@/context/SafeDataContext";

type Tab = "till" | "safe" | "workbench";

const TABS: { id: Tab; label: string }[] = [
  { id: "till", label: "Till" },
  { id: "safe", label: "Safe" },
  { id: "workbench", label: "Workbench" },
];

const CashHub = memo(function CashHub() {
  const [activeTab, setActiveTab] = useState<Tab>("till");

  return (
    <SafeDataProvider>
      <div className="flex border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === "till" && <TillReconciliation />}
      {activeTab === "safe" && <SafeReconciliation />}
      {activeTab === "workbench" && <ReconciliationWorkbench />}
    </SafeDataProvider>
  );
});

export default CashHub;
