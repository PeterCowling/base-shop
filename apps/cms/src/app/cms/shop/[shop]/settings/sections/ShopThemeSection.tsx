"use client";

import Link from "next/link";
import { resetThemeOverride } from "@cms/actions/shops.server";

import { useTranslations } from "@acme/i18n";
import DataTable from "@acme/ui/components/cms/DataTable";

import { Button } from "@/components/atoms/shadcn";

import {
  createThemeTokenColumns,
  type ThemeTokenRow,
  themeTokenRowClassName,
} from "../tableMappers";

export type ShopThemeSectionErrors = Partial<
  Record<"themeDefaults" | "themeOverrides", string[]>
>;

export interface ShopThemeSectionProps {
  readonly shop: string;
  readonly tokenRows: ThemeTokenRow[];
  readonly themeDefaults?: Record<string, unknown> | null;
  readonly themeOverrides?: Record<string, unknown> | null;
  readonly errors?: ShopThemeSectionErrors;
}

export default function ShopThemeSection({
  shop,
  tokenRows,
  themeDefaults,
  themeOverrides,
  errors,
}: ShopThemeSectionProps) {
  const t = useTranslations();
  const columns = createThemeTokenColumns({
    onReset: ({ token }) => (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          (
            resetThemeOverride as unknown as (
              shop: string,
              token: string,
              formData: FormData,
            ) => void
          )(shop, token, new FormData());
        }}
      >
        <Button
          type="submit"
          variant="ghost"
          className="h-auto p-0 text-link hover:bg-transparent"
        >
          {t("Reset")}
        </Button>
      </form>
    ),
  });

  const defaultsError = errors?.themeDefaults?.join("; ");
  const overridesError = errors?.themeOverrides?.join("; ");

  // i18n-exempt: hidden form field names for backend processing; not user-facing copy
  const THEME_DEFAULTS_NAME = "themeDefaults" as const;
  const THEME_OVERRIDES_NAME = "themeOverrides" as const;

  return (
    <div className="col-span-2 flex flex-col gap-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="min-w-0">{t("Theme tokens")}</span>
        <Link
          href={`/cms/shop/${shop}/themes`}
          className="h-auto shrink-0 p-0 text-link hover:bg-transparent"
        >
          {t("Edit Theme")}
        </Link>
      </div>
      <DataTable
        rows={tokenRows}
        columns={columns}
        rowClassName={themeTokenRowClassName}
      />
      <input
        type="hidden"
        name={THEME_DEFAULTS_NAME}
        value={JSON.stringify(themeDefaults ?? {})}
      />
      <input
        type="hidden"
        name={THEME_OVERRIDES_NAME}
        value={JSON.stringify(themeOverrides ?? {})}
      />
      {defaultsError ? (
        <span className="text-sm text-destructive" role="alert">
          {defaultsError}
        </span>
      ) : null}
      {overridesError ? (
        <span className="text-sm text-destructive" role="alert">
          {overridesError}
        </span>
      ) : null}
    </div>
  );
}
