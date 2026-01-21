// packages/ui/src/components/cms/page-builder/panels/InteractionsPanel.tsx
"use client";

import type { PageComponent } from "@acme/types";

import AnimationControls from "./interactions/AnimationControls";
import ChildrenControls from "./interactions/ChildrenControls";
import ClickActionControls from "./interactions/ClickActionControls";
import HoverEffectsControls from "./interactions/HoverEffectsControls";
import MotionPresetControls from "./interactions/MotionPresetControls";
import RevealControls from "./interactions/RevealControls";
import ScrollEffectsControls from "./interactions/ScrollEffectsControls";

interface Props {
  component: PageComponent;
  handleInput: <K extends keyof PageComponent>(
    field: K,
    value: PageComponent[K],
  ) => void;
}

export default function InteractionsPanel({ component, handleInput }: Props) {
  return (
    <div className="space-y-2">
      <ClickActionControls component={component} handleInput={handleInput} />
      <AnimationControls component={component} handleInput={handleInput} />
      <MotionPresetControls component={component} handleInput={handleInput} />
      <RevealControls component={component} handleInput={handleInput} />
      <ScrollEffectsControls component={component} handleInput={handleInput} />
      <HoverEffectsControls component={component} handleInput={handleInput} />
      <ChildrenControls component={component} handleInput={handleInput} />
    </div>
  );
}
