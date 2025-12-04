import type { Decorator } from "@storybook/react";
import React, { useEffect } from "react";

type StressMode = "none" | "long-text" | "unbroken" | "empty";

// Toolbar control to toggle stress mode per story
export const stressGlobal = {
  name: "Stress",
  description: "Content stress mode",
  defaultValue: "none" as StressMode,
  toolbar: {
    icon: "paragraph",
    items: [
      { value: "none", title: "None" },
      { value: "long-text", title: "Double length text" },
      { value: "unbroken", title: "Unbroken strings" },
      { value: "empty", title: "Empty/loading" },
    ],
  },
};

// Utility class applied to root to help stories conditionally render stressed content
const STRESS_CLASS_MAP: Record<StressMode, string> = {
  none: "",
  "long-text": "stress-long-text",
  unbroken: "stress-unbroken",
  empty: "stress-empty",
};

function StressClassApplier({ stress, children }: { stress: StressMode; children: React.ReactNode }) {
  const className = STRESS_CLASS_MAP[stress] ?? "";

  useEffect(() => {
    const root = document.documentElement.classList;
    // Always reset previously applied stress classes to avoid leaks between stories
    Object.values(STRESS_CLASS_MAP).forEach((cls) => {
      if (cls) root.remove(cls);
    });
    if (className) root.add(className);
  }, [className]);

  return <>{children}</>;
}

export const withStress: Decorator = (Story, context) => {
  const stress = (context.globals.stress as StressMode | undefined) ?? "none";
  return (
    <StressClassApplier stress={stress}>
      <Story />
    </StressClassApplier>
  );
};
