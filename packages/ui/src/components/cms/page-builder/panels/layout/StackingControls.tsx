// packages/ui/src/components/cms/page-builder/panels/layout/StackingControls.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";
import type { EditorContextProps } from "./types";

interface Props extends EditorContextProps {
  component: PageComponent;
}

export default function StackingControls({ component, editorFlags, onUpdateEditor, editorMap, updateEditorForId }: Props) {
  const isContainer = ("children" in (component as any)) || ("columns" in (component as any));
  if (!isContainer) return null;
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {(["desktop", "tablet", "mobile"] as const).map((dev) => (
          <Select
            key={`stack-${dev}`}
            value={
              (editorFlags as any)?.[`stack${dev.charAt(0).toUpperCase() + dev.slice(1)}`] ??
              (dev === "mobile" ? ((editorFlags as any)?.stackStrategy ?? "default") : "default")
            }
            onValueChange={(v) => onUpdateEditor?.({ [`stack${dev.charAt(0).toUpperCase() + dev.slice(1)}`]: (v as any) } as any)}
          >
            <Tooltip text={`Stacking on ${dev}`} className="block">
              <SelectTrigger>
                <SelectValue placeholder={`Stacking (${dev})`} />
              </SelectTrigger>
            </Tooltip>
            <SelectContent>
              <SelectItem value="default">Default order</SelectItem>
              <SelectItem value="reverse">Reverse</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        ))}
      </div>
      {(["desktop", "tablet", "mobile"] as const).map((dev) => {
        const eff = (editorFlags as any)?.[`stack${dev.charAt(0).toUpperCase() + dev.slice(1)}`] ?? (dev === "mobile" ? ((editorFlags as any)?.stackStrategy ?? "default") : "default");
        if (eff !== "custom" || !Array.isArray((component as any).children)) return null;
        return (
          <div key={`orders-${dev}`} className="mt-2 space-y-2">
            <div className="text-xs text-muted-foreground">Custom order on {dev} (lower appears first)</div>
            {((component as any).children as PageComponent[]).map((child: PageComponent, idx: number) => {
              const childFlags = (editorMap ?? {})[child.id] as any;
              const key = `order${dev.charAt(0).toUpperCase() + dev.slice(1)}`;
              const val = (childFlags?.[key] as number | undefined);
              return (
                <Input
                  key={`${child.id}-${dev}`}
                  type="number"
                  label={`${(child as any).name || child.type}`}
                  placeholder={String(idx)}
                  value={val === undefined ? "" : String(val)}
                  onChange={(e) => {
                    const v = e.target.value === "" ? undefined : Math.max(0, parseInt(e.target.value, 10) || 0);
                    updateEditorForId?.(child.id, { [key]: v as number | undefined } as any);
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </>
  );
}

