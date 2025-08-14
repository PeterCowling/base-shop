// packages/ui/src/components/cms/page-builder/panels/LayoutPanel.tsx
"use client";

import type { PageComponent } from "@acme/types";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../atoms/shadcn";

interface Props {
  component: PageComponent;
  handleInput: (field: string, value: any) => void;
  handleResize: (field: string, value: string) => void;
  handleFullSize: (field: string) => void;
}

export default function LayoutPanel({
  component,
  handleInput,
  handleResize,
  handleFullSize,
}: Props) {
  return (
    <div className="space-y-2">
      {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
        <div key={vp} className="space-y-2">
          <div className="flex items-end gap-2">
            <Input
              label={`Width (${vp})`}
              placeholder="e.g. 100px or 50%"
              title="CSS width value with units"
              value={(component as any)[`width${vp}`] ?? ""}
              onChange={(e) => handleResize(`width${vp}`, e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => handleFullSize(`width${vp}`)}
            >
              Full width
            </Button>
          </div>
          <div className="flex items-end gap-2">
            <Input
              label={`Height (${vp})`}
              placeholder="e.g. 1px or 1rem"
              title="CSS height value with units"
              value={(component as any)[`height${vp}`] ?? ""}
              onChange={(e) => handleResize(`height${vp}`, e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => handleFullSize(`height${vp}`)}
            >
              Full height
            </Button>
          </div>
        </div>
      ))}
      <Select
        value={component.position ?? ""}
        onValueChange={(v) => handleInput("position", v || undefined)}
      >
        <SelectTrigger title="CSS position property">
          <SelectValue placeholder="Position" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="relative">relative</SelectItem>
          <SelectItem value="absolute">absolute</SelectItem>
        </SelectContent>
      </Select>
      {component.position === "absolute" && (
        <>
          <Input
            label="Top"
            placeholder="e.g. 10px"
            title="CSS top offset with units"
            value={component.top ?? ""}
            onChange={(e) => handleResize("top", e.target.value)}
          />
          <Input
            label="Left"
            placeholder="e.g. 10px"
            title="CSS left offset with units"
            value={component.left ?? ""}
            onChange={(e) => handleResize("left", e.target.value)}
          />
        </>
      )}
      {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
        <div key={`spacing-${vp}`} className="space-y-2">
          <Input
            label={`Margin (${vp})`}
            placeholder="e.g. 1rem"
            title="CSS margin value with units"
            value={(component as any)[`margin${vp}`] ?? ""}
            onChange={(e) => handleResize(`margin${vp}`, e.target.value)}
          />
          <Input
            label={`Padding (${vp})`}
            placeholder="e.g. 1rem"
            title="CSS padding value with units"
            value={(component as any)[`padding${vp}`] ?? ""}
            onChange={(e) => handleResize(`padding${vp}`, e.target.value)}
          />
        </div>
      ))}
      <Input
        label="Margin"
        placeholder="e.g. 1rem"
        title="Global CSS margin value with units"
        value={component.margin ?? ""}
        onChange={(e) => handleInput("margin", e.target.value)}
      />
      <Input
        label="Padding"
        placeholder="e.g. 1rem"
        title="Global CSS padding value with units"
        value={component.padding ?? ""}
        onChange={(e) => handleInput("padding", e.target.value)}
      />
      {"gap" in component && (
        <Input
          label="Gap"
          placeholder="e.g. 1rem"
          title="Gap between items"
          value={(component as any).gap ?? ""}
          onChange={(e) => handleInput("gap", e.target.value)}
        />
      )}
    </div>
  );
}

