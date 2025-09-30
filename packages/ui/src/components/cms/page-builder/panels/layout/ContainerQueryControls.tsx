// packages/ui/src/components/cms/page-builder/panels/layout/ContainerQueryControls.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { useTranslations } from "@acme/i18n";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";

interface Props {
  component: PageComponent;
  handleInput: <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void;
}

export default function ContainerQueryControls({ component, handleInput }: Props) {
  const t = useTranslations();
  return (
    <div className="mt-2 border-t pt-2">
      <div className="mb-1 text-xs font-semibold text-muted-foreground">{t("cms.builder.layout.containerQueries.title")}</div>
      <Select
        value={(component as Record<string, unknown>)["containerType"] as string | undefined ?? ""}
        onValueChange={(v) =>
          // Local loosening to support extra builder-only fields
          (handleInput as unknown as (field: string, value: unknown) => void)(
            "containerType",
            v === "__default__" ? (undefined as unknown) : (v as unknown),
          )
        }
      >
        <Tooltip text={t("cms.builder.layout.containerType.tooltip") as string} className="block">
          <SelectTrigger>
            <SelectValue placeholder={t("cms.builder.layout.containerType.placeholder") as string} />
          </SelectTrigger>
        </Tooltip>
        <SelectContent>
          <SelectItem value="__default__">{t("cms.builder.layout.containerType.option.default")}</SelectItem>
          <SelectItem value="size">{t("cms.builder.layout.containerType.option.size")}</SelectItem>
          <SelectItem value="inline-size">{t("cms.builder.layout.containerType.option.inlineSize")}</SelectItem>
        </SelectContent>
      </Select>
      <Input
        label={
          <span className="flex items-center gap-1">
            {t("cms.builder.layout.containerName.label")}
            <Tooltip text={t("cms.builder.layout.containerName.tooltip") as string}>?</Tooltip>
          </span>
        }
        placeholder={t("cms.builder.layout.containerName.placeholder") as string}
        value={(component as Record<string, unknown>)["containerName"] as string | undefined ?? ""}
        onChange={(e) =>
          // Local loosening to support extra builder-only fields
          (handleInput as unknown as (field: string, value: unknown) => void)(
            "containerName",
            (e.target.value || undefined) as unknown,
          )
        }
      />
    </div>
  );
}
