// packages/ui/src/components/cms/page-builder/panels/LottieControls.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox } from "../../../atoms/shadcn";

interface Props {
  component: PageComponent;
  handleInput: <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void;
}

export default function LottieControls({ component, handleInput }: Props) {
  const lottieUrl = (component as any).lottieUrl as string | undefined;
  const lottieAutoplay = (component as any).lottieAutoplay as boolean | undefined;
  const lottieLoop = (component as any).lottieLoop as boolean | undefined;
  const lottieSpeed = (component as any).lottieSpeed as number | undefined;
  const lottieTrigger = (component as any).lottieTrigger as ("load"|"hover"|"click"|"in-view"|"scroll") | undefined;

  return (
    <div className="space-y-2">
      <Input
        label="Lottie JSON URL"
        placeholder="https://example.com/anim.json"
        value={lottieUrl ?? ""}
        onChange={(e) => handleInput("lottieUrl" as any, (e.target.value || undefined) as any)}
      />
      <div className="grid grid-cols-3 gap-2 items-end">
        <label className="col-span-1 flex items-center justify-between rounded border border-border-3 bg-muted/30 px-3 py-2 text-sm">
          <span>Autoplay</span>
          <Checkbox
            checked={!!lottieAutoplay}
            onCheckedChange={(v) => handleInput("lottieAutoplay" as any, Boolean(v) as any)}
          />
        </label>
        <label className="col-span-1 flex items-center justify-between rounded border border-border-3 bg-muted/30 px-3 py-2 text-sm">
          <span>Loop</span>
          <Checkbox
            checked={!!lottieLoop}
            onCheckedChange={(v) => handleInput("lottieLoop" as any, Boolean(v) as any)}
          />
        </label>
        <Input
          type="number"
          step="0.1"
          min="0.1"
          label="Speed"
          placeholder="1"
          value={lottieSpeed ?? ""}
          onChange={(e) => handleInput("lottieSpeed" as any, (e.target.value === "" ? undefined : Number(e.target.value)) as any)}
        />
      </div>
      <Select
        value={lottieTrigger ?? "load"}
        onValueChange={(v) => handleInput("lottieTrigger" as any, v as any)}
      >
        <SelectTrigger aria-label="Lottie Trigger">
          <SelectValue placeholder="Trigger" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="load">On Load</SelectItem>
          <SelectItem value="in-view">On In-View</SelectItem>
          <SelectItem value="hover">On Hover</SelectItem>
          <SelectItem value="click">On Click</SelectItem>
          <SelectItem value="scroll">Scroll Progress</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
