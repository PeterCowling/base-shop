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
  const duration = (component as any).animationDuration as number | undefined;
  const delay = (component as any).animationDelay as number | undefined;
  const easing = (component as any).animationEasing as string | undefined;
  const reveal = (component as any).reveal as string | undefined;
  const parallax = (component as any).parallax as number | undefined;
  const sticky = (component as any).sticky as ("top" | "bottom") | undefined;
  const stickyOffset = (component as any).stickyOffset as string | number | undefined;
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
          <SelectItem value="slide">Slide (default)</SelectItem>
          <SelectItem value="slide-up">Slide Up</SelectItem>
          <SelectItem value="slide-down">Slide Down</SelectItem>
          <SelectItem value="slide-left">Slide Left</SelectItem>
          <SelectItem value="slide-right">Slide Right</SelectItem>
          <SelectItem value="zoom">Zoom</SelectItem>
          <SelectItem value="rotate">Rotate</SelectItem>
        </SelectContent>
      </Select>

      {/* Timing controls */}
      <div className="grid grid-cols-3 gap-2">
        <Input
          type="number"
          label="Duration (ms)"
          placeholder="500"
          value={duration ?? ""}
          onChange={(e) =>
            handleInput(
              "animationDuration" as keyof PageComponent,
              (e.target.value === ""
                ? undefined
                : Math.max(0, Number(e.target.value))) as any,
            )
          }
        />
        <Input
          type="number"
          label="Delay (ms)"
          placeholder="0"
          value={delay ?? ""}
          onChange={(e) =>
            handleInput(
              "animationDelay" as keyof PageComponent,
              (e.target.value === ""
                ? undefined
                : Math.max(0, Number(e.target.value))) as any,
            )
          }
        />
        <Select
          value={easing ?? ""}
          onValueChange={(v) =>
            handleInput(
              "animationEasing" as keyof PageComponent,
              (v || undefined) as any,
            )
          }
        >
          <SelectTrigger aria-label="Easing" onMouseDown={openSelectOnMouseDown}>
            <SelectValue placeholder="Easing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Default</SelectItem>
            <SelectItem value="ease">ease</SelectItem>
            <SelectItem value="linear">linear</SelectItem>
            <SelectItem value="ease-in">ease-in</SelectItem>
            <SelectItem value="ease-out">ease-out</SelectItem>
            <SelectItem value="ease-in-out">ease-in-out</SelectItem>
            <SelectItem value="cubic-bezier(0.4, 0, 0.2, 1)">cubic-bezier(0.4,0,0.2,1)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Scroll effects */}
      <Select
        value={reveal ?? ""}
        onValueChange={(v) =>
          handleInput(
            "reveal" as keyof PageComponent,
            (v || undefined) as any,
          )
        }
      >
        <SelectTrigger aria-label="Reveal on Scroll" onMouseDown={openSelectOnMouseDown}>
          <SelectValue placeholder="Reveal on Scroll" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">None</SelectItem>
          <SelectItem value="fade">Fade</SelectItem>
          <SelectItem value="slide-up">Slide Up</SelectItem>
          <SelectItem value="slide-down">Slide Down</SelectItem>
          <SelectItem value="slide-left">Slide Left</SelectItem>
          <SelectItem value="slide-right">Slide Right</SelectItem>
          <SelectItem value="zoom">Zoom</SelectItem>
          <SelectItem value="rotate">Rotate</SelectItem>
        </SelectContent>
      </Select>

      <div className="grid grid-cols-3 gap-2">
        <Input
          type="number"
          step="0.05"
          min="-5"
          max="5"
          label="Parallax"
          placeholder="0.2"
          value={parallax ?? ""}
          onChange={(e) =>
            handleInput(
              "parallax" as keyof PageComponent,
              (e.target.value === ""
                ? undefined
                : Number(e.target.value)) as any,
            )
          }
        />
        <Select
          value={sticky ?? ""}
          onValueChange={(v) =>
            handleInput(
              "sticky" as keyof PageComponent,
              (v || undefined) as any,
            )
          }
        >
          <SelectTrigger aria-label="Sticky" onMouseDown={openSelectOnMouseDown}>
            <SelectValue placeholder="Sticky" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            <SelectItem value="top">Top</SelectItem>
            <SelectItem value="bottom">Bottom</SelectItem>
          </SelectContent>
        </Select>
        <Input
          label="Sticky offset"
          placeholder="64px"
          value={stickyOffset ?? ""}
          onChange={(e) =>
            handleInput(
              "stickyOffset" as keyof PageComponent,
              (e.target.value === "" ? undefined : e.target.value) as any,
            )
          }
        />
      </div>
    </div>
  );
}
