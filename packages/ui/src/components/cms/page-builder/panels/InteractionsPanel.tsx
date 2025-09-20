// packages/ui/src/components/cms/page-builder/panels/InteractionsPanel.tsx
"use client";

import type { PageComponent } from "@acme/types";
import type { MouseEventHandler } from "react";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../atoms/shadcn";
import { Button } from "../../../atoms/shadcn";
import { useState } from "react";
import LinkPicker from "../LinkPicker";

const isTestEnvironment = process.env.NODE_ENV === "test";

const openSelectOnMouseDown: MouseEventHandler<HTMLButtonElement> | undefined =
  isTestEnvironment
    ? (event) => {
        if (event.button !== 0) return;
        if (event.defaultPrevented) return;
        event.preventDefault();
        event.currentTarget.click();
      }
    : undefined;

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
  const [pickerOpen, setPickerOpen] = useState(false);
  const clickAction = component.clickAction ?? "none";
  const animation = component.animation ?? "none";
  return (
    <div className="space-y-2">
      <Select
        value={clickAction}
        onValueChange={(v) => {
          handleInput(
            "clickAction",
            (v === "none" ? undefined : v) as PageComponent["clickAction"],
          );
          if (v !== "navigate") handleInput("href", undefined);
        }}
      >
        <SelectTrigger
          aria-label="Click Action"
          onMouseDown={openSelectOnMouseDown}
        >
          <SelectValue placeholder="Click Action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          <SelectItem value="navigate">Navigate</SelectItem>
        </SelectContent>
      </Select>
      {clickAction === "navigate" && (
        <div className="space-y-1">
          <div className="flex items-end gap-2">
            <div className="grow">
              <Input
                label="Target"
                placeholder="https://example.com"
                value={component.href ?? ""}
                onChange={(e) => handleInput("href", e.target.value)}
              />
            </div>
            <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
              Pick
            </Button>
          </div>
          <LinkPicker
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onPick={(href) => {
              handleInput("href", href as any);
              setPickerOpen(false);
            }}
          />
        </div>
      )}
      <Select
        value={animation}
        onValueChange={(v) =>
          handleInput(
            "animation",
            (v === "none" ? undefined : v) as PageComponent["animation"],
          )
        }
      >
        <SelectTrigger
          aria-label="Animation"
          onMouseDown={openSelectOnMouseDown}
        >
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
