// packages/ui/src/components/cms/page-builder/panels/content/AlignmentControls.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";
import type { ContentComponent, HandleInput } from "./types";
import { isOverridden } from "./helpers";
import { Grid, Inline } from "../../../../atoms/primitives";

interface Props {
  component: PageComponent;
  handleInput: HandleInput;
}

export default function AlignmentControls({ component, handleInput }: Props) {
  const comp = component as ContentComponent;

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
              {/* i18n-exempt: Builder control label */}
              <SelectValue placeholder="Justify Items (base)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="start">start</SelectItem>
              <SelectItem value="center">center</SelectItem>
              <SelectItem value="end">end</SelectItem>
              <SelectItem value="stretch">stretch</SelectItem>
            </SelectContent>
          </Select>
          {/* i18n-exempt: Builder tooltip */}
          <Tooltip text="Horizontal alignment of items (base)">
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
                {/* i18n-exempt: Builder control label */}
                <SelectValue placeholder={`Justify Items (${vp})`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="start">start</SelectItem>
                <SelectItem value="center">center</SelectItem>
                <SelectItem value="end">end</SelectItem>
                <SelectItem value="stretch">stretch</SelectItem>
              </SelectContent>
            </Select>
            {/* i18n-exempt: Builder tooltip */}
            <Tooltip text={`Horizontal items alignment on ${vp.toLowerCase()}`}>
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
              {/* i18n-exempt: Status chip label */}
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
              <button
                type="button"
                className="underline min-h-10 min-w-10"
                onClick={() => setField(`justifyItems${vp}` as keyof ContentComponent, undefined as unknown as ContentComponent["justifyItems"]) }
              >
                {/* i18n-exempt: Action label */}
                Reset
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
              {/* i18n-exempt: Builder control label */}
              <SelectValue placeholder="Align Items (base)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="start">start</SelectItem>
              <SelectItem value="center">center</SelectItem>
              <SelectItem value="end">end</SelectItem>
              <SelectItem value="stretch">stretch</SelectItem>
            </SelectContent>
          </Select>
          {/* i18n-exempt: Builder tooltip */}
          <Tooltip text="Vertical alignment of items (base)">
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
                {/* i18n-exempt: Builder control label */}
                <SelectValue placeholder={`Align Items (${vp})`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="start">start</SelectItem>
                <SelectItem value="center">center</SelectItem>
                <SelectItem value="end">end</SelectItem>
                <SelectItem value="stretch">stretch</SelectItem>
              </SelectContent>
            </Select>
            {/* i18n-exempt: Builder tooltip */}
            <Tooltip text={`Vertical items alignment on ${vp.toLowerCase()}`}>
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
              {/* i18n-exempt: Status chip label */}
              <span className="rounded bg-amber-500/20 px-1 text-amber-700">Override active</span>
              <button
                type="button"
                className="underline min-h-10 min-w-10"
                onClick={() => setField(`alignItems${vp}` as keyof ContentComponent, undefined as unknown as ContentComponent["alignItems"]) }
              >
                {/* i18n-exempt: Action label */}
                Reset
              </button>
            </Inline>
          ) : null
        ))}
      </Grid>
    </>
  );
}
