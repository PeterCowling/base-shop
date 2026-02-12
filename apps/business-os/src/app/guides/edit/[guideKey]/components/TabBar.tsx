"use client";

import clsx from "clsx";

import type { EditorTab } from "../types";
import { EDITOR_TABS } from "../types";

type TabBarProps = {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  disabled?: boolean;
};

export default function TabBar({ activeTab, onTabChange, disabled }: TabBarProps) {
  return (
    <nav className="flex flex-wrap gap-1 rounded-lg border border-brand-outline/20 bg-brand-surface/50 p-1">
      {EDITOR_TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            disabled={disabled}
            className={clsx(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-brand-primary text-white shadow-sm"
                : "text-brand-text/70 hover:bg-brand-surface hover:text-brand-text",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
