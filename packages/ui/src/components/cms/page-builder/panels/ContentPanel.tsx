// packages/ui/src/components/cms/page-builder/panels/ContentPanel.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Suspense } from "react";
import editorRegistry from "../editorRegistry";
import type { EditorProps } from "../EditorProps";
import type { ComponentType, LazyExoticComponent } from "react";
import MinMaxItems from "./content/MinMaxItems";
import ResponsiveItems from "./content/ResponsiveItems";
import ColumnsControls from "./content/ColumnsControls";
import GapControls from "./content/GapControls";
import AlignmentControls from "./content/AlignmentControls";
import { getContentSuggestions } from "./content/contentSuggestions";

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
  const Specific: LazyExoticComponent<ComponentType<EditorProps>> | undefined = editorRegistry[component.type];
  const suggestionsEnabled = (process.env.NEXT_PUBLIC_CMS_CONTENT_SUGGESTIONS || "").toString().toLowerCase() === "true";
  const suggestions = suggestionsEnabled ? getContentSuggestions(component) : [];
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

      {suggestionsEnabled && suggestions.length > 0 && (
        <div className="space-y-1" data-testid="content-suggestions">
          <div className="text-xs font-semibold text-muted-foreground">Suggestions</div>
          <div className="grid grid-cols-2 gap-2">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                className="rounded border p-2 text-start hover:bg-accent/30"
                onClick={() => {
                  try {
                    const patch = s.apply(component);
                    if (patch && typeof patch === "object") onChange(patch);
                  } catch (e) {
                    // no-op on apply errors
                  }
                }}
                title={s.description || s.label}
                aria-label={`Apply suggestion: ${s.label}`}
              >
                <div className="text-xs font-medium">{s.label}</div>
                {s.description && (
                  <div className="text-[11px] text-muted-foreground">{s.description}</div>
                )}
              </button>
            ))}
          </div>
        </div>
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
