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
  Textarea,
} from "../../../atoms/shadcn";
import { Button } from "../../../atoms/shadcn";
import { useState } from "react";
import LinkPicker from "../LinkPicker";
import { easingPresets } from "./EasingPresets";
import { motionPresets } from "./MotionPresets";

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
  const hoverScale = (component as any).hoverScale as number | undefined;
  const hoverOpacity = (component as any).hoverOpacity as number | undefined;
  const staggerChildren = (component as any).staggerChildren as number | undefined;
  return (
    <div className="space-y-2">
      <Select
        value={clickAction}
        onValueChange={(v) => {
          handleInput(
            "clickAction",
            (v === "none" ? undefined : v) as PageComponent["clickAction"],
          );
          if (v !== "navigate" && v !== "scroll-to") handleInput("href", undefined);
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
                onChange={(e) => handleInput("href", e.target.value)}
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
        value={easing ?? "__none__"}
        onValueChange={(v) =>
          handleInput(
            "animationEasing" as keyof PageComponent,
            (v === "__none__" ? undefined : (v as any)) as any,
          )
        }
      >
          <SelectTrigger aria-label="Easing" onMouseDown={openSelectOnMouseDown}>
            <SelectValue placeholder="Easing" />
          </SelectTrigger>
          <SelectContent>
            {easingPresets.map((e) => (
              <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
            ))}
          </SelectContent>
      </Select>
      </div>

      {/* Motion presets */}
      <div className="grid grid-cols-3 gap-2 items-end">
        <Select
          value={((component as any).motionPreset as string | undefined) ?? "__none__"}
          onValueChange={(v) => handleInput("motionPreset" as any, v === "__none__" ? (undefined as any) : (v as any))}
        >
          <SelectTrigger aria-label="Motion Preset" onMouseDown={openSelectOnMouseDown}>
            <SelectValue placeholder="Preset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No preset</SelectItem>
            {motionPresets.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          className="col-span-2"
          onClick={() => {
            const id = ((component as any).motionPreset as string | undefined) ?? "";
            const preset = motionPresets.find((p) => p.id === id);
            if (preset) preset.apply(handleInput as any);
          }}
        >
          Apply Preset
        </Button>
      </div>
      
      <Select
        value={reveal ?? "__none__"}
        onValueChange={(v) =>
          handleInput(
            "reveal" as keyof PageComponent,
            (v === "__none__" ? undefined : (v as any)) as any,
          )
        }
      >
        <SelectTrigger aria-label="Reveal on Scroll" onMouseDown={openSelectOnMouseDown}>
          <SelectValue placeholder="Reveal on Scroll" />
        </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
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
          value={sticky ?? "__none__"}
          onValueChange={(v) =>
            handleInput(
              "sticky" as keyof PageComponent,
              (v === "__none__" ? undefined : (v as any)) as any,
            )
          }
        >
          <SelectTrigger aria-label="Sticky" onMouseDown={openSelectOnMouseDown}>
            <SelectValue placeholder="Sticky" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
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
      
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          step="0.01"
          min="0"
          label="Hover scale"
          placeholder="1.05"
          value={hoverScale ?? ""}
          onChange={(e) =>
            handleInput(
              "hoverScale" as keyof PageComponent,
              (e.target.value === "" ? undefined : Number(e.target.value)) as any,
            )
          }
        />
        <Input
          type="number"
          step="0.05"
          min="0"
          max="1"
          label="Hover opacity"
          placeholder="0.9"
          value={hoverOpacity ?? ""}
          onChange={(e) =>
            handleInput(
              "hoverOpacity" as keyof PageComponent,
              (e.target.value === "" ? undefined : Number(e.target.value)) as any,
            )
          }
        />
      </div>
      
      <Input
        type="number"
        label="Stagger children (ms)"
        placeholder="80"
        value={staggerChildren ?? ""}
        onChange={(e) =>
          handleInput(
            "staggerChildren" as keyof PageComponent,
            (e.target.value === "" ? undefined : Math.max(0, Number(e.target.value))) as any,
          )
        }
      />
    </div>
  );
}
