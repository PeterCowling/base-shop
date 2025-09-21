"use client";

import { Button } from "@/components/atoms/shadcn";
import { resetThemeOverride } from "@cms/actions/shops.server";
import Link from "next/link";
import DataTable from "@ui/components/cms/DataTable";
import {
  createThemeTokenColumns,
  themeTokenRowClassName,
  type ThemeTokenRow,
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
          className="h-auto p-0 text-primary hover:bg-transparent"
        >
          Reset
        </Button>
      </form>
    ),
  });

  const defaultsError = errors?.themeDefaults?.join("; ");
  const overridesError = errors?.themeOverrides?.join("; ");

  return (
    <div className="col-span-2 flex flex-col gap-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="min-w-0">Theme tokens</span>
        <Link
          href={`/cms/shop/${shop}/themes`}
          className="h-auto shrink-0 p-0 text-primary hover:bg-transparent"
        >
          Edit Theme
        </Link>
      </div>
      <DataTable
        rows={tokenRows}
        columns={columns}
        rowClassName={themeTokenRowClassName}
      />
      <input
        type="hidden"
        name="themeDefaults"
        value={JSON.stringify(themeDefaults ?? {})}
      />
      <input
        type="hidden"
        name="themeOverrides"
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
