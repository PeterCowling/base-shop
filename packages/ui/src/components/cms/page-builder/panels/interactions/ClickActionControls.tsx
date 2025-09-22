"use client";

import { useState } from "react";
import type { InteractionsProps } from "./types";
import { openSelectOnMouseDown } from "./helpers";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Button,
} from "../../../../atoms/shadcn";
import LinkPicker from "../../LinkPicker";

export default function ClickActionControls({ component, handleInput }: InteractionsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const clickAction = component.clickAction ?? "none";

  return (
    <div className="space-y-2">
      <Select
        value={clickAction}
        onValueChange={(v) => {
          handleInput(
            "clickAction",
            (v === "none" ? undefined : v) as (typeof component)["clickAction"],
          );
          if (v !== "navigate" && v !== "scroll-to") handleInput("href", undefined as any);
        }}
      >
        <SelectTrigger aria-label="Click Action" onMouseDown={openSelectOnMouseDown}>
          <SelectValue placeholder="Click Action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          <SelectItem value="navigate">Navigate</SelectItem>
          <SelectItem value="scroll-to">Scroll to</SelectItem>
          <SelectItem value="open-modal">Open modal</SelectItem>
        </SelectContent>
      </Select>

      {(clickAction === "navigate" || clickAction === "scroll-to") && (
        <div className="space-y-1">
          <div className="flex items-end gap-2">
            <div className="grow">
              <Input
                label={clickAction === "scroll-to" ? "Target (anchor)" : "Target"}
                placeholder={clickAction === "scroll-to" ? "#section-id" : "https://example.com"}
                value={component.href ?? ""}
                onChange={(e) => handleInput("href", e.target.value as any)}
              />
            </div>
            {clickAction === "navigate" && (
              <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
                Pick
              </Button>
            )}
          </div>
          {clickAction === "navigate" && (
            <LinkPicker
              open={pickerOpen}
              onClose={() => setPickerOpen(false)}
              onPick={(href) => {
                handleInput("href", href as any);
                setPickerOpen(false);
              }}
            />
          )}
        </div>
      )}

      {clickAction === "open-modal" && (
        <div>
          <Textarea
            label="Modal Content"
            placeholder="Plain text"
            value={((component as any).modalHtml ?? "") as any}
            onChange={(e) => handleInput("modalHtml" as any, (e.target.value || undefined) as any)}
            rows={3}
          />
        </div>
      )}
    </div>
  );
}

