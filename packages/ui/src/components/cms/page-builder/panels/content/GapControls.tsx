// packages/ui/src/components/cms/page-builder/panels/content/GapControls.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { useTranslations } from "@acme/i18n";
import { Input } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";
import { Button } from "../../../../atoms/shadcn";
import type { ContentComponent, HandleInput } from "./types";
import { isOverridden } from "./helpers";

interface Props {
  component: PageComponent;
  handleInput: HandleInput;
}

export default function GapControls({ component, handleInput }: Props) {
  const t = useTranslations();
  if (!("gap" in component)) return null;

  const comp = component as ContentComponent;

  // Bridge to allow setting fields defined on ContentComponent
  const setField = <K extends keyof ContentComponent>(
    field: K,
    value: ContentComponent[K],
  ) => {
    handleInput(
      field as unknown as keyof PageComponent,
      value as unknown as PageComponent[keyof PageComponent],
    );
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Input
          label={t("Gap (Desktop)")}
          value={comp.gapDesktop ?? ""}
          onChange={(e) => setField("gapDesktop", (e.target.value || undefined))}
          placeholder={t("e.g. 24px") as string}
        />
        <Tooltip text={t("Gap between items on desktop")}>?</Tooltip>
      </div>
      {isOverridden(comp.gap, comp.gapDesktop) && (
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded bg-muted px-1 text-primary">{t("Override active")}</span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setField("gapDesktop", undefined)}
          >
            {t("Reset")}
          </Button>
        </div>
      )}

      <div className="flex items-center gap-1">
        <Input
          label={t("Gap (Tablet)")}
          value={comp.gapTablet ?? ""}
          onChange={(e) => setField("gapTablet", (e.target.value || undefined))}
          placeholder={t("e.g. 16px") as string}
        />
        <Tooltip text={t("Gap between items on tablet")}>?</Tooltip>
      </div>
      {isOverridden(comp.gap, comp.gapTablet) && (
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded bg-muted px-1 text-primary">{t("Override active")}</span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setField("gapTablet", undefined)}
          >
            {t("Reset")}
          </Button>
        </div>
      )}

      <div className="flex items-center gap-1">
        <Input
          label={t("Gap (Mobile)")}
          value={comp.gapMobile ?? ""}
          onChange={(e) => setField("gapMobile", (e.target.value || undefined))}
          placeholder={t("e.g. 8px") as string}
        />
        <Tooltip text={t("Gap between items on mobile")}>?</Tooltip>
      </div>
      {isOverridden(comp.gap, comp.gapMobile) && (
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded bg-muted px-1 text-primary">{t("Override active")}</span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setField("gapMobile", undefined)}
          >
            {t("Reset")}
          </Button>
        </div>
      )}
    </>
  );
}
