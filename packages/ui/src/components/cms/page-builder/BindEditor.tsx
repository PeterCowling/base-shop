"use client";

import { useTranslations } from "@acme/i18n";
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
  const t = useTranslations();
  return (
    <div className="grid grid-cols-1 gap-2">
      <Input
        label={t("Target prop name") as string}
        placeholder={t("text | src | href") as string}
        value={component.prop ?? ""}
        onChange={(e) => onChange({ prop: e.target.value || undefined })}
      />
      <Input
        label={t("Field path") as string}
        placeholder={t("title or image.url") as string}
        value={component.path ?? ""}
        onChange={(e) => onChange({ path: e.target.value || undefined })}
      />
      <Input
        label={t("Fallback") as string}
        placeholder={t("Optional default when empty") as string}
        value={(component.fallback as string) ?? ""}
        onChange={(e) => onChange({ fallback: e.target.value })}
      />
      <p className="text-xs text-muted-foreground">
        {t("Wrap a component with Bind and set the prop to inject from the current item. Use dot notation for nested fields.")}
      </p>
    </div>
  );
}
