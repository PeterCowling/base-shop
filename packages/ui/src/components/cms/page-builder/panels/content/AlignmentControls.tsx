// packages/ui/src/components/cms/page-builder/panels/content/AlignmentControls.tsx
"use client";

import { useTranslations } from "@acme/i18n";
import type { PageComponent } from "@acme/types";

import { Tooltip } from "../../../../atoms";
import { Grid, Inline } from "../../../../atoms/primitives";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../atoms/shadcn";

import { isOverridden } from "./helpers";
import type { ContentComponent, HandleInput } from "./types";

interface Props {
  component: PageComponent;
  handleInput: HandleInput;
}

export default function AlignmentControls({ component, handleInput }: Props) {
  const comp = component as ContentComponent;
  const t = useTranslations();

  const setField = <K extends keyof ContentComponent>(field: K, value: ContentComponent[K]) =>
    (handleInput as unknown as (f: string, v: unknown) => void)(field as string, value as unknown);

  type VP = "Desktop" | "Tablet" | "Mobile";
  const viewports: VP[] = ["Desktop", "Tablet", "Mobile"];

  return (
    <>
      <Grid cols={1} gap={2}>
        <Inline gap={1}>
          <Select
            value={comp.justifyItems ?? ""}
            onValueChange={(v) => setField("justifyItems", (v || undefined) as ContentComponent["justifyItems"])}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("cms.builder.controls.justifyItems.base.placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="start">start</SelectItem>
              <SelectItem value="center">center</SelectItem>
              <SelectItem value="end">end</SelectItem>
              <SelectItem value="stretch">stretch</SelectItem>
            </SelectContent>
          </Select>
          <Tooltip text={t("cms.builder.controls.justifyItems.tooltip.base")}>
            <span className="inline-flex items-center justify-center size-10">?</span>
          </Tooltip>
        </Inline>
        {viewports.map((vp) => (
          <Inline key={`ji-${vp}`} gap={1}>
            <Select
              value={(comp[`justifyItems${vp}` as keyof ContentComponent] as unknown as ContentComponent["justifyItems"]) ?? ""}
              onValueChange={(v) =>
                setField(
                  `justifyItems${vp}` as keyof ContentComponent,
                  (v || undefined) as ContentComponent["justifyItems"],
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("cms.builder.controls.justifyItems.vp.placeholder", { vp })} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="start">start</SelectItem>
                <SelectItem value="center">center</SelectItem>
                <SelectItem value="end">end</SelectItem>
                <SelectItem value="stretch">stretch</SelectItem>
              </SelectContent>
            </Select>
            <Tooltip text={t("cms.builder.controls.justifyItems.tooltip.vp", { vp: vp.toLowerCase() })}>
              <span className="inline-flex items-center justify-center size-10">?</span>
            </Tooltip>
          </Inline>
        ))}
        {viewports.map((vp) => (
          isOverridden(
            comp.justifyItems,
            comp[`justifyItems${vp}` as keyof ContentComponent] as unknown as ContentComponent["justifyItems"],
          ) ? (
            <Inline key={`jio-${vp}`} gap={2} className="text-xs">
              <span className="rounded bg-muted px-1 text-primary">{t("cms.builder.override.active")}</span>
              <button
                type="button"
                className="underline min-h-10 min-w-10"
                onClick={() => setField(`justifyItems${vp}` as keyof ContentComponent, undefined as unknown as ContentComponent["justifyItems"]) }
              >
                {t("actions.reset")}
              </button>
            </Inline>
          ) : null
        ))}
      </Grid>

      <Grid cols={1} gap={2}>
        <Inline gap={1}>
          <Select
            value={comp.alignItems ?? ""}
            onValueChange={(v) => setField("alignItems", (v || undefined) as ContentComponent["alignItems"])}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("cms.builder.controls.alignItems.base.placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="start">start</SelectItem>
              <SelectItem value="center">center</SelectItem>
              <SelectItem value="end">end</SelectItem>
              <SelectItem value="stretch">stretch</SelectItem>
            </SelectContent>
          </Select>
          <Tooltip text={t("cms.builder.controls.alignItems.tooltip.base")}>
            <span className="inline-flex items-center justify-center size-10">?</span>
          </Tooltip>
        </Inline>
        {viewports.map((vp) => (
          <Inline key={`ai-${vp}`} gap={1}>
            <Select
              value={(comp[`alignItems${vp}` as keyof ContentComponent] as unknown as ContentComponent["alignItems"]) ?? ""}
              onValueChange={(v) =>
                setField(
                  `alignItems${vp}` as keyof ContentComponent,
                  (v || undefined) as ContentComponent["alignItems"],
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("cms.builder.controls.alignItems.vp.placeholder", { vp })} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="start">start</SelectItem>
                <SelectItem value="center">center</SelectItem>
                <SelectItem value="end">end</SelectItem>
                <SelectItem value="stretch">stretch</SelectItem>
              </SelectContent>
            </Select>
            <Tooltip text={t("cms.builder.controls.alignItems.tooltip.vp", { vp: vp.toLowerCase() })}>
              <span className="inline-flex items-center justify-center size-10">?</span>
            </Tooltip>
          </Inline>
        ))}
        {viewports.map((vp) => (
          isOverridden(
            comp.alignItems,
            comp[`alignItems${vp}` as keyof ContentComponent] as unknown as ContentComponent["alignItems"],
          ) ? (
            <Inline key={`aio-${vp}`} gap={2} className="text-xs">
              <span className="rounded bg-muted px-1 text-primary">{t("cms.builder.override.active")}</span>
              <button
                type="button"
                className="underline min-h-10 min-w-10"
                onClick={() => setField(`alignItems${vp}` as keyof ContentComponent, undefined as unknown as ContentComponent["alignItems"]) }
              >
                {t("actions.reset")}
              </button>
            </Inline>
          ) : null
        ))}
      </Grid>
    </>
  );
}
