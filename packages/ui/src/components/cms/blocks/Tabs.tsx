"use client";
import { useState } from "react";
import type { ReactNode } from "react";

interface Tab {
  label: string;
}

interface Props {
  tabs?: Tab[];
  activeTab?: number;
  children?: ReactNode[];
}

export default function TabsBlock({ tabs = [], activeTab = 0, children = [] }: Props) {
  const [current, setCurrent] = useState(activeTab);
  if (!tabs.length) return null;
  return (
    <div>
      <div className="flex border-b">
        {tabs.map((tab, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrent(i)}
            className={`px-4 py-2 ${current === i ? "border-b-2 border-primary" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4">
        {Array.isArray(children) ? children[current] : children}
      </div>
    </div>
  );
}
