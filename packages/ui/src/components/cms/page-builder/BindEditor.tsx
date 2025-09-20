"use client";

import type { PageComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";

type BindComponent = PageComponent & {
  prop?: string;
  path?: string;
  fallback?: unknown;
};

interface Props {
  component: BindComponent;
  onChange: (patch: Partial<BindComponent>) => void;
}

export default function BindEditor({ component, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 gap-2">
      <Input
        label="Target prop name"
        placeholder="text | src | href"
        value={component.prop ?? ""}
        onChange={(e) => onChange({ prop: e.target.value || undefined })}
      />
      <Input
        label="Field path"
        placeholder="title or image.url"
        value={component.path ?? ""}
        onChange={(e) => onChange({ path: e.target.value || undefined })}
      />
      <Input
        label="Fallback"
        placeholder="Optional default when empty"
        value={(component.fallback as string) ?? ""}
        onChange={(e) => onChange({ fallback: e.target.value })}
      />
      <p className="text-xs text-muted-foreground">
        Wrap a component with Bind and set the prop to inject from the current item. Use dot notation for nested fields.
      </p>
    </div>
  );
}

