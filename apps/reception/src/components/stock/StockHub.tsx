"use client";

import { memo, useState } from "react";

import { Button } from "@acme/design-system/atoms";
import { Inline } from "@acme/design-system/primitives";

import IngredientStock from "@/components/inventory/IngredientStock";
import Stock from "@/components/man/Stock";

type Tab = "stock" | "ingredients";

const TABS: { id: Tab; label: string }[] = [
  { id: "stock", label: "Stock" },
  { id: "ingredients", label: "Ingredients" },
];

const StockHub = memo(function StockHub() {
  const [activeTab, setActiveTab] = useState<Tab>("stock");

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
                ? "border-primary text-primary bg-primary/10"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </Inline>
      {activeTab === "stock" && <Stock />}
      {activeTab === "ingredients" && <IngredientStock />}
    </>
  );
});

export default StockHub;
