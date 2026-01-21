// packages/ui/src/components/cms/page-builder/panels/layout/StackingControls.tsx
"use client";

import { useTranslations } from "@acme/i18n";
import type { PageComponent } from "@acme/types";

import { Tooltip } from "@acme/design-system/atoms";
import { Grid } from "@acme/design-system/primitives/Grid";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@acme/design-system/shadcn";

import type { EditorContextProps, EditorFlags } from "./types";

interface Props extends EditorContextProps {
  component: PageComponent;
}

export default function StackingControls({ component, editorFlags, onUpdateEditor, editorMap, updateEditorForId }: Props) {
  const t = useTranslations();
  const cRec = component as unknown as Record<string, unknown>;
  const isContainer = ("children" in cRec) || ("columns" in cRec);
  if (!isContainer) return null;
  return (
    <>
      <Grid cols={3} gap={2}>
        {(["desktop", "tablet", "mobile"] as const).map((dev) => (
          <Select
            key={`stack-${dev}`}
            value={
              ((editorFlags ?? {})[
                (`stack${dev.charAt(0).toUpperCase() + dev.slice(1)}` as keyof EditorFlags)
              ] as "default" | "reverse" | "custom" | undefined) ??
              (dev === "mobile" ? ((editorFlags?.stackStrategy as "default" | "reverse" | "custom" | undefined) ?? "default") : "default")
            }
            onValueChange={(v) =>
              onUpdateEditor?.({
                [`stack${dev.charAt(0).toUpperCase() + dev.slice(1)}`]: v as "default" | "reverse" | "custom",
              } as Partial<EditorFlags>)}
          >
            <Tooltip text={t(`Stacking on ${dev}`)} className="block">
              <SelectTrigger>
                <SelectValue placeholder={t(`Stacking (${dev})`) as string} />
              </SelectTrigger>
            </Tooltip>
            <SelectContent>
              <SelectItem value="default">{t("Default order")}</SelectItem>
              <SelectItem value="reverse">{t("Reverse")}</SelectItem>
              <SelectItem value="custom">{t("Custom")}</SelectItem>
            </SelectContent>
          </Select>
        ))}
      </Grid>
      {(["desktop", "tablet", "mobile"] as const).map((dev) => {
        const eff = (editorFlags ?? {})[
          (`stack${dev.charAt(0).toUpperCase() + dev.slice(1)}` as keyof EditorFlags)
        ] ?? (dev === "mobile" ? (editorFlags?.stackStrategy ?? "default") : "default");
        if (eff !== "custom" || !Array.isArray((cRec as { children?: unknown }).children)) return null;
        return (
          <div key={`orders-${dev}`} className="mt-2 space-y-2">
            <div className="text-xs text-muted-foreground">{t(`Custom order on ${dev} (lower appears first)`)}</div>
            {((cRec.children as PageComponent[]) ?? []).map((child: PageComponent, idx: number) => {
              const childFlags = (editorMap as unknown as Record<string, EditorFlags | undefined> | undefined)?.[child.id];
              const key = `order${dev.charAt(0).toUpperCase() + dev.slice(1)}`;
              const val = (childFlags?.[key as keyof EditorFlags] as number | undefined);
              return (
                <Input
                  key={`${child.id}-${dev}`}
                  type="number"
                  label={`${(child as unknown as Record<string, unknown>).name || child.type}`}
                  placeholder={String(idx)}
                  value={val === undefined ? "" : String(val)}
                  onChange={(e) => {
                    const v = e.target.value === "" ? undefined : Math.max(0, parseInt(e.target.value, 10) || 0);
                    updateEditorForId?.(child.id, { [key]: v as number | undefined } as Partial<EditorFlags>);
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
