"use client";

import { memo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@acme/design-system/atoms";
import { Inline } from "@acme/design-system/primitives";

import SafeReconciliation from "@/components/safe/SafeReconciliation";
import ReconciliationWorkbench from "@/components/till/ReconciliationWorkbench";
import TillReconciliation from "@/components/till/Till";
import { SafeDataProvider } from "@/context/SafeDataContext";

type Tab = "till" | "safe" | "workbench";

const VALID_TABS = new Set<Tab>(["till", "safe", "workbench"]);

const TABS: { id: Tab; label: string }[] = [
  { id: "till", label: "Till" },
  { id: "safe", label: "Safe" },
  { id: "workbench", label: "Workbench" },
];

const CashHub = memo(function CashHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: Tab =
    tabParam && VALID_TABS.has(tabParam as Tab) ? (tabParam as Tab) : "till";

  const setActiveTab = useCallback(
    (tab: Tab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`/cash?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <SafeDataProvider>
      <Inline className="border-b border-border">
        {TABS.map((tab) => (
          <Button
            compatibilityMode="passthrough"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-primary text-primary bg-primary/10"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </Inline>
      {activeTab === "till" && <TillReconciliation />}
      {activeTab === "safe" && <SafeReconciliation />}
      {activeTab === "workbench" && <ReconciliationWorkbench />}
    </SafeDataProvider>
  );
});

export default CashHub;
