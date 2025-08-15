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
import { Tooltip } from "../../../atoms";

interface Props {
  component: PageComponent;
  handleInput: <K extends keyof PageComponent>(
    field: K,
    value: PageComponent[K]
  ) => void;
  handleResize: (field: string, value: string) => void;
  handleFullSize: (field: string) => void;
}

export default function LayoutPanel({
  component,
  handleInput,
  handleResize,
  handleFullSize,
}: Props) {
  const cssError = (prop: string, value?: string) =>
    value && !globalThis.CSS?.supports(prop, value)
      ? `Invalid ${prop} value`
      : undefined;
  const viewports = ["Desktop", "Tablet", "Mobile"] as const;
  const widthKeys = {
    Desktop: "widthDesktop",
    Tablet: "widthTablet",
    Mobile: "widthMobile",
  } as const;
  const heightKeys = {
    Desktop: "heightDesktop",
    Tablet: "heightTablet",
    Mobile: "heightMobile",
  } as const;
  const marginKeys = {
    Desktop: "marginDesktop",
    Tablet: "marginTablet",
    Mobile: "marginMobile",
  } as const;
  const paddingKeys = {
    Desktop: "paddingDesktop",
    Tablet: "paddingTablet",
    Mobile: "paddingMobile",
  } as const;
  return (
    <div className="space-y-2">
      {viewports.map((vp) => (
        <div key={vp} className="space-y-2">
          <div className="flex items-end gap-2">
            <Input
              label={
                <span className="flex items-center gap-1">
                  {`Width (${vp})`}
                  <Tooltip text="CSS width value with units">?</Tooltip>
                </span>
              }
              placeholder="e.g. 100px or 50%"
              value={component[widthKeys[vp]] ?? ""}
              error={cssError("width", component[widthKeys[vp]])}
              onChange={(e) => handleResize(widthKeys[vp], e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => handleFullSize(widthKeys[vp])}
            >
              Full width
            </Button>
          </div>
          <div className="flex items-end gap-2">
            <Input
              label={
                <span className="flex items-center gap-1">
                  {`Height (${vp})`}
                  <Tooltip text="CSS height value with units">?</Tooltip>
                </span>
              }
              placeholder="e.g. 1px or 1rem"
              value={component[heightKeys[vp]] ?? ""}
              error={cssError("height", component[heightKeys[vp]])}
              onChange={(e) => handleResize(heightKeys[vp], e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => handleFullSize(heightKeys[vp])}
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
        <Tooltip text="CSS position property" className="block">
          <SelectTrigger>
            <SelectValue placeholder="Position" />
          </SelectTrigger>
        </Tooltip>
        <SelectContent>
          <SelectItem value="relative">relative</SelectItem>
          <SelectItem value="absolute">absolute</SelectItem>
        </SelectContent>
      </Select>
      {component.position === "absolute" && (
        <>
          <Input
            label={
              <span className="flex items-center gap-1">
                Top
                <Tooltip text="CSS top offset with units">?</Tooltip>
              </span>
            }
            placeholder="e.g. 10px"
            value={component.top ?? ""}
            error={cssError("top", component.top)}
            onChange={(e) => handleResize("top", e.target.value)}
          />
          <Input
            label={
              <span className="flex items-center gap-1">
                Left
                <Tooltip text="CSS left offset with units">?</Tooltip>
              </span>
            }
            placeholder="e.g. 10px"
            value={component.left ?? ""}
            error={cssError("left", component.left)}
            onChange={(e) => handleResize("left", e.target.value)}
          />
        </>
      )}
      {viewports.map((vp) => (
        <div key={`spacing-${vp}`} className="space-y-2">
          <Input
            label={
              <span className="flex items-center gap-1">
                {`Margin (${vp})`}
                <Tooltip text="CSS margin value with units">?</Tooltip>
              </span>
            }
            placeholder="e.g. 1rem"
            value={component[marginKeys[vp]] ?? ""}
            error={cssError("margin", component[marginKeys[vp]])}
            onChange={(e) => handleResize(marginKeys[vp], e.target.value)}
          />
          <Input
            label={
              <span className="flex items-center gap-1">
                {`Padding (${vp})`}
                <Tooltip text="CSS padding value with units">?</Tooltip>
              </span>
            }
            placeholder="e.g. 1rem"
            value={component[paddingKeys[vp]] ?? ""}
            error={cssError("padding", component[paddingKeys[vp]])}
            onChange={(e) => handleResize(paddingKeys[vp], e.target.value)}
          />
        </div>
      ))}
      <Input
        label={
          <span className="flex items-center gap-1">
            Margin
            <Tooltip text="Global CSS margin value with units">?</Tooltip>
          </span>
        }
        placeholder="e.g. 1rem"
        value={component.margin ?? ""}
        error={cssError("margin", component.margin)}
        onChange={(e) => handleInput("margin", e.target.value)}
      />
      <Input
        label={
          <span className="flex items-center gap-1">
            Padding
            <Tooltip text="Global CSS padding value with units">?</Tooltip>
          </span>
        }
        placeholder="e.g. 1rem"
        value={component.padding ?? ""}
        error={cssError("padding", component.padding)}
        onChange={(e) => handleInput("padding", e.target.value)}
      />
      {"gap" in component && (
        <Input
          label={
            <span className="flex items-center gap-1">
              Gap
              <Tooltip text="Gap between items">?</Tooltip>
            </span>
          }
          placeholder="e.g. 1rem"
          value={component.gap ?? ""}
          error={cssError("gap", component.gap)}
          onChange={(e) => handleInput("gap", e.target.value)}
        />
      )}
    </div>
  );
}
