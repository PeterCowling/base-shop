"use client";

import { memo, useState } from "react";

import MenuPerformanceDashboard from "@/components/analytics/MenuPerformanceDashboard";
import Live from "@/components/live/Live";
import RealTimeDashboard from "@/components/reports/RealTimeDashboard";
import VarianceHeatMap from "@/components/reports/VarianceHeatMap";
import Statistics from "@/components/stats/Statistics";

type Tab = "live" | "dashboard" | "variance" | "menu" | "stats";

const TABS: { id: Tab; label: string }[] = [
  { id: "live", label: "Live" },
  { id: "dashboard", label: "Dashboard" },
  { id: "variance", label: "Variance" },
  { id: "menu", label: "Menu" },
  { id: "stats", label: "Stats" },
];

const AnalyticsHub = memo(function AnalyticsHub() {
  const [activeTab, setActiveTab] = useState<Tab>("live");

  return (
    <>
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
      {activeTab === "live" && <Live />}
      {activeTab === "dashboard" && <RealTimeDashboard />}
      {activeTab === "variance" && <VarianceHeatMap />}
      {activeTab === "menu" && <MenuPerformanceDashboard />}
      {activeTab === "stats" && <Statistics />}
    </>
  );
});

export default AnalyticsHub;
