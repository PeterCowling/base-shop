// packages/ui/src/components/cms/page-builder/panels/content/ResponsiveItems.tsx
"use client";

import type { PageComponent } from "@acme/types";
import { Input } from "../../../../atoms/shadcn";
import { Tooltip } from "../../../../atoms";
import { Button } from "../../../../atoms/shadcn";
import { useTranslations } from "@acme/i18n";
import type { ContentComponent, HandleInput } from "./types";
import { nonNegative } from "./helpers";

interface Props {
  component: PageComponent;
  handleInput: HandleInput;
}

export default function ResponsiveItems({ component, handleInput }: Props) {
  const t = useTranslations();
  if (!("desktopItems" in component || "tabletItems" in component || "mobileItems" in component)) {
    return null;
  }

  // Bridge to allow setting fields defined on ContentComponent while keeping
  // HandleInput's PageComponent signature intact without using `any`.
  const setField = <K extends keyof ContentComponent>(
    field: K,
    value: ContentComponent[K],
  ) => {
    handleInput(
      field as unknown as keyof PageComponent,
      value as unknown as PageComponent[keyof PageComponent],
    );
  };

  const comp = component as ContentComponent;
  const desktopItemsError = nonNegative(comp.desktopItems);
  const tabletItemsError = nonNegative(comp.tabletItems);
  const mobileItemsError = nonNegative(comp.mobileItems);

  return (
    <>
      <div className="flex items-center gap-1">
        <Input
          label={t("Desktop Items")}
          type="number"
          value={comp.desktopItems ?? ""}
          onChange={(e) =>
            setField(
              "desktopItems",
              e.target.value === "" ? undefined : Number(e.target.value),
            )
          }
          min={0}
          error={desktopItemsError}
        />
        <Tooltip text={t("Items shown on desktop")}>?</Tooltip>
      </div>
      {comp.desktopItems !== undefined && (
        <div className="mt-1 flex items-center gap-2 text-xs">
          <span className="rounded bg-amber-500/20 px-1 text-amber-700">{t("Override active")}</span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setField("desktopItems", undefined)}
          >
            {t("Reset")}
          </Button>
        </div>
      )}

      <div className="flex items-center gap-1">
        <Input
          label={t("Tablet Items")}
          type="number"
          value={comp.tabletItems ?? ""}
          onChange={(e) =>
            setField(
              "tabletItems",
              e.target.value === "" ? undefined : Number(e.target.value),
            )
          }
          min={0}
          error={tabletItemsError}
        />
        <Tooltip text={t("Items shown on tablet")}>?</Tooltip>
      </div>
      {comp.tabletItems !== undefined && (
        <div className="mt-1 flex items-center gap-2 text-xs">
          <span className="rounded bg-amber-500/20 px-1 text-amber-700">{t("Override active")}</span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setField("tabletItems", undefined)}
          >
            {t("Reset")}
          </Button>
        </div>
      )}

      <div className="flex items-center gap-1">
        <Input
          label={t("Mobile Items")}
          type="number"
          value={comp.mobileItems ?? ""}
          onChange={(e) =>
            setField(
              "mobileItems",
              e.target.value === "" ? undefined : Number(e.target.value),
            )
          }
          min={0}
          error={mobileItemsError}
        />
        <Tooltip text={t("Items shown on mobile")}>?</Tooltip>
      </div>
      {comp.mobileItems !== undefined && (
        <div className="mt-1 flex items-center gap-2 text-xs">
          <span className="rounded bg-amber-500/20 px-1 text-amber-700">{t("Override active")}</span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setField("mobileItems", undefined)}
          >
            {t("Reset")}
          </Button>
        </div>
      )}
    </>
  );
}
