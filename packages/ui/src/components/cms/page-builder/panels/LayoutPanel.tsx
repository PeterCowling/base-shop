"use client";

import type { PageComponent } from "@acme/types";
import type { EditorFlags } from "@acme/types";
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
    value: PageComponent[K],
  ) => void;
  handleResize: (field: string, value: string) => void;
  handleFullSize: (field: string) => void;
  editorFlags?: EditorFlags;
  onUpdateEditor?: (patch: Partial<EditorFlags>) => void;
}

export default function LayoutPanel({
  component,
  handleInput,
  handleResize,
  handleFullSize,
  editorFlags,
  onUpdateEditor,
}: Props) {
  const cssError = (prop: string, value?: string) =>
    value && !globalThis.CSS?.supports(prop, value)
      ? `Invalid ${prop} value`
      : undefined;
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <Input
          label={
            <span className="flex items-center gap-1">
              z-index
              <Tooltip text="Stacking order (number)">?</Tooltip>
            </span>
          }
          type="number"
          value={(editorFlags?.zIndex as number | undefined) ?? ((component.zIndex as number | undefined) ?? "")}
          onChange={(e) => {
            const val = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
            if (onUpdateEditor) onUpdateEditor({ zIndex: val as number | undefined });
          }}
        />
        <div className="flex gap-1">
          <Button type="button" variant="outline" onClick={() => onUpdateEditor?.({ zIndex: Math.max(0, (editorFlags?.zIndex as number | undefined) ?? 0) })}>Back</Button>
          <Button type="button" variant="outline" onClick={() => onUpdateEditor?.({ zIndex: (((editorFlags?.zIndex as number | undefined) ?? 0) - 1) })}>-1</Button>
          <Button type="button" variant="outline" onClick={() => onUpdateEditor?.({ zIndex: (((editorFlags?.zIndex as number | undefined) ?? 0) + 1) })}>+1</Button>
          <Button type="button" variant="outline" onClick={() => onUpdateEditor?.({ zIndex: 999 })}>Front</Button>
        </div>
      </div>
      {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
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
              value={
                (component[`width${vp}` as keyof PageComponent] as string) ?? ""
              }
              error={cssError(
                "width",
                component[`width${vp}` as keyof PageComponent] as string
              )}
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
              label={
                <span className="flex items-center gap-1">
                  {`Height (${vp})`}
                  <Tooltip text="CSS height value with units">?</Tooltip>
                </span>
              }
              placeholder="e.g. 1px or 1rem"
              value={
                (component[`height${vp}` as keyof PageComponent] as string) ??
                ""
              }
              error={cssError(
                "height",
                component[`height${vp}` as keyof PageComponent] as string
              )}
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
        onValueChange={(v) =>
          handleInput(
            "position",
            (v || undefined) as PageComponent["position"],
          )
        }
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
      {(["Desktop", "Tablet", "Mobile"] as const).map((vp) => (
        <div key={`spacing-${vp}`} className="space-y-2">
          <Input
            label={
              <span className="flex items-center gap-1">
                {`Margin (${vp})`}
                <Tooltip text="CSS margin value with units">?</Tooltip>
              </span>
            }
            placeholder="e.g. 1rem"
            value={
              (component[`margin${vp}` as keyof PageComponent] as string) ??
              ""
            }
            error={cssError(
              "margin",
              component[`margin${vp}` as keyof PageComponent] as string
            )}
            onChange={(e) => handleResize(`margin${vp}`, e.target.value)}
          />
          <Input
            label={
              <span className="flex items-center gap-1">
                {`Padding (${vp})`}
                <Tooltip text="CSS padding value with units">?</Tooltip>
              </span>
            }
            placeholder="e.g. 1rem"
            value={
              (component[`padding${vp}` as keyof PageComponent] as string) ??
              ""
            }
            error={cssError(
              "padding",
              component[`padding${vp}` as keyof PageComponent] as string
            )}
            onChange={(e) => handleResize(`padding${vp}`, e.target.value)}
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
          value={(component as { gap?: string }).gap ?? ""}
          error={cssError("gap", (component as { gap?: string }).gap)}
          onChange={(e) => handleInput("gap", e.target.value)}
        />
      )}
    </div>
  );
}
