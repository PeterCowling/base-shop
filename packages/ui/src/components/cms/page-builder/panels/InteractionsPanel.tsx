// packages/ui/src/components/cms/page-builder/panels/InteractionsPanel.tsx
"use client";

import type { PageComponent } from "@acme/types";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../atoms/shadcn";

interface Props {
  component: PageComponent;
  handleInput: <K extends keyof PageComponent>(
    field: K,
    value: PageComponent[K],
  ) => void;
}

export default function InteractionsPanel({
  component,
  handleInput,
}: Props) {
  const clickAction = (component as any).clickAction ?? "none";
  const animation = (component as any).animation ?? "none";
  return (
    <div className="space-y-2">
      <Select
        value={clickAction}
        onValueChange={(v) => {
          handleInput("clickAction", v === "none" ? undefined : v);
          if (v !== "navigate") handleInput("href", undefined);
        }}
      >
        <SelectTrigger aria-label="Click Action">
          <SelectValue placeholder="Click Action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          <SelectItem value="navigate">Navigate</SelectItem>
        </SelectContent>
      </Select>
      {clickAction === "navigate" && (
        <Input
          label="Target"
          placeholder="https://example.com"
          value={(component as any).href ?? ""}
          onChange={(e) => handleInput("href", e.target.value)}
        />
      )}
      <Select
        value={animation}
        onValueChange={(v) =>
          handleInput("animation", v === "none" ? undefined : v)
        }
      >
        <SelectTrigger aria-label="Animation">
          <SelectValue placeholder="Animation" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          <SelectItem value="fade">Fade</SelectItem>
          <SelectItem value="slide">Slide</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

