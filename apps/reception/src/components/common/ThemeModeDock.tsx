"use client";

import { memo } from "react";

import { ThemeToggle } from "@acme/ui/molecules";

const ThemeModeDock = memo(function ThemeModeDock() {
  return (
    <div className="fixed end-4 bottom-4 z-40 rounded-full border border-border bg-surface/90 p-2 shadow-lg backdrop-blur">
      <ThemeToggle />
    </div>
  );
});

export default ThemeModeDock;
