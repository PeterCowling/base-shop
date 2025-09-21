// packages/ui/src/components/cms/page-builder/panels/ContentPanel.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Suspense } from "react";
import editorRegistry from "../editorRegistry";
import MinMaxItems from "./content/MinMaxItems";
import ResponsiveItems from "./content/ResponsiveItems";
import ColumnsControls from "./content/ColumnsControls";
import GapControls from "./content/GapControls";
import AlignmentControls from "./content/AlignmentControls";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
  handleInput: <K extends keyof PageComponent>(
    field: K,
    value: PageComponent[K],
  ) => void;
}

export default function ContentPanel({
  component,
  onChange,
  handleInput,
}: Props) {
  const isMultiColumn = (component as any).type === "MultiColumn";
  const Specific = editorRegistry[component.type];
  return (
    <div className="space-y-2">
      {("minItems" in component || "maxItems" in component) && (
        <MinMaxItems component={component} onChange={onChange} handleInput={handleInput} />
      )}

      {("desktopItems" in component || "tabletItems" in component || "mobileItems" in component) && (
        <ResponsiveItems component={component} handleInput={handleInput} />
      )}

      {"columns" in component && (
        <ColumnsControls component={component} handleInput={handleInput} />
      )}

      {"gap" in component && (
        <GapControls component={component} handleInput={handleInput} />
      )}

      {isMultiColumn && (
        <AlignmentControls component={component} handleInput={handleInput} />
      )}
      <Suspense fallback={<p className="text-muted text-sm">Loading...</p>}>
        {Specific ? (
          <Specific component={component} onChange={onChange} />
        ) : (
          <p className="text-muted text-sm">No editable props</p>
        )}
      </Suspense>
    </div>
  );
}
