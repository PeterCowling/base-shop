// packages/ui/src/components/cms/page-builder/panels/TimelinePanel.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { useMemo } from "react";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox } from "../../../atoms/shadcn";
import { easingPresets } from "./EasingPresets";

interface Props {
  component: PageComponent;
  handleInput: <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void;
}

type TimelineStep = NonNullable<NonNullable<PageComponent["timeline"]>["steps"]>[number];

export default function TimelinePanel({ component, handleInput }: Props) {
  const timeline = (component as any).timeline as PageComponent["timeline"] | undefined;
  const steps: TimelineStep[] = useMemo(() => [...((timeline?.steps as TimelineStep[] | undefined) ?? [])], [timeline?.steps]);
  const trigger = (timeline?.trigger as any) as ("load" | "click" | "in-view" | "scroll") | undefined;
  const loop = timeline?.loop as boolean | undefined;

  const update = (patch: Partial<NonNullable<PageComponent["timeline"]>>) => {
    const next = { ...(timeline ?? {}), ...patch } as any;
    // Normalize: strip empty steps
    if (Array.isArray(next.steps)) {
      next.steps = next.steps.filter((s: any) => s && Object.keys(s).length > 0);
    }
    // If object is empty, unset
    if (!next.trigger && !next.loop && (!next.steps || next.steps.length === 0) && !next.name) {
      handleInput("timeline" as any, undefined as any);
      return;
    }
    handleInput("timeline" as any, next);
  };

  const addStep = () => {
    const next = [...steps, { duration: 400, easing: "ease", opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 } as TimelineStep];
    update({ steps: next });
  };

  const removeStep = (idx: number) => {
    const next = steps.filter((_, i) => i !== idx);
    update({ steps: next });
  };

  const moveStep = (idx: number, dir: -1 | 1) => {
    const to = idx + dir;
    if (to < 0 || to >= steps.length) return;
    const next = [...steps];
    const [s] = next.splice(idx, 1);
    next.splice(to, 0, s);
    update({ steps: next });
  };

  const editStep = (idx: number, patch: Partial<TimelineStep>) => {
    const next = [...steps];
    next[idx] = { ...next[idx], ...patch } as any;
    update({ steps: next });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 items-end">
        <Select
          value={trigger ?? "load"}
          onValueChange={(v) => update({ trigger: v as any })}
        >
          <SelectTrigger aria-label="Timeline Trigger">
            <SelectValue placeholder="Trigger" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="load">On Load</SelectItem>
            <SelectItem value="in-view">On In-View</SelectItem>
            <SelectItem value="click">On Click</SelectItem>
            <SelectItem value="scroll">Scroll Progress</SelectItem>
          </SelectContent>
        </Select>
        <label className="col-span-1 flex items-center justify-between rounded border border-border/60 bg-muted/30 px-3 py-2 text-sm">
          <span>Loop</span>
          <Checkbox checked={!!loop} onCheckedChange={(v: boolean) => update({ loop: Boolean(v) })} />
        </label>
        <Input
          label="Name (optional)"
          placeholder="Hero entrance"
          value={timeline?.name ?? ""}
          onChange={(e) => update({ name: e.target.value || undefined })}
        />
      </div>

      <div className="space-y-2">
        {steps.map((s, idx) => (
          <div key={idx} className="rounded-md border border-border/60 bg-muted/10 p-2">
            <div className="flex items-center justify-between pb-2">
              <div className="text-xs font-semibold">Step {idx + 1}</div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => moveStep(idx, -1)} disabled={idx === 0}>
                  Up
                </Button>
                <Button type="button" variant="outline" onClick={() => moveStep(idx, +1)} disabled={idx === steps.length - 1}>
                  Down
                </Button>
                <Button type="button" variant="destructive" onClick={() => removeStep(idx)}>
                  Remove
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {trigger === "scroll" ? (
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  label="At (0..1)"
                  placeholder="0.00"
                  value={s.at ?? ""}
                  onChange={(e) => editStep(idx, { at: e.target.value === "" ? undefined : Number(e.target.value) })}
                />
              ) : (
                <Input
                  type="number"
                  min="0"
                  label="Duration (ms)"
                  placeholder="400"
                  value={s.duration ?? ""}
                  onChange={(e) => editStep(idx, { duration: e.target.value === "" ? undefined : Math.max(0, Number(e.target.value)) })}
                />
              )}
              <Select
                value={(s.easing as string | undefined) ?? "__none__"}
                onValueChange={(v) => editStep(idx, { easing: v === "__none__" ? undefined : (v as any) })}
              >
                <SelectTrigger aria-label={`Easing step ${idx + 1}`}>
                  <SelectValue placeholder="Easing" />
                </SelectTrigger>
                <SelectContent>
                  {easingPresets.map((e) => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.05"
                min="0"
                max="1"
                label="Opacity"
                placeholder="1"
                value={typeof s.opacity === "number" ? s.opacity : ""}
                onChange={(e) => editStep(idx, { opacity: e.target.value === "" ? undefined : Number(e.target.value) })}
              />
              <Input
                type="number"
                step="1"
                label="X (px)"
                placeholder="0"
                value={typeof s.x === "number" ? s.x : ""}
                onChange={(e) => editStep(idx, { x: e.target.value === "" ? undefined : Number(e.target.value) })}
              />
              <Input
                type="number"
                step="1"
                label="Y (px)"
                placeholder="0"
                value={typeof s.y === "number" ? s.y : ""}
                onChange={(e) => editStep(idx, { y: e.target.value === "" ? undefined : Number(e.target.value) })}
              />
              <Input
                type="number"
                step="0.01"
                min="0"
                label="Scale"
                placeholder="1"
                value={typeof s.scale === "number" ? s.scale : ""}
                onChange={(e) => editStep(idx, { scale: e.target.value === "" ? undefined : Number(e.target.value) })}
              />
              <Input
                type="number"
                step="1"
                label="Rotate (deg)"
                placeholder="0"
                value={typeof s.rotate === "number" ? s.rotate : ""}
                onChange={(e) => editStep(idx, { rotate: e.target.value === "" ? undefined : Number(e.target.value) })}
              />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addStep}>Add Step</Button>
      </div>
    </div>
  );
}
