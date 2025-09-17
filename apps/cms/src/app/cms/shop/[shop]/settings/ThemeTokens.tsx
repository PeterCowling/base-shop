// apps/cms/src/app/cms/shop/[shop]/settings/ThemeTokens.tsx
"use client";

import { Button } from "@/components/atoms/shadcn";
import { resetThemeOverride } from "@cms/actions/shops.server";
import type { Shop } from "@acme/types";
import Link from "next/link";
import DataTable from "@ui/components/cms/DataTable";
import {
  createThemeTokenColumns,
  themeTokenRowClassName,
  type ThemeTokenRow,
} from "./tableMappers";

interface Props {
  shop: string;
  tokenRows: ThemeTokenRow[];
  info: Shop;
  errors: Record<string, string[]>;
}

export default function ThemeTokens({ shop, tokenRows, info, errors }: Props) {
  const columns = createThemeTokenColumns({
    onReset: ({ token }) => (
      <form
        onSubmit={(e) => {
          e.preventDefault();
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

  return (
    <div className="col-span-2 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span>Theme Tokens</span>
        <Link
          href={`/cms/shop/${shop}/themes`}
          className="h-auto p-0 text-primary hover:bg-transparent"
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
        value={JSON.stringify(info.themeDefaults ?? {})}
      />
      <input
        type="hidden"
        name="themeOverrides"
        value={JSON.stringify(info.themeOverrides ?? {})}
      />
      {errors.themeDefaults && (
        <span className="text-sm text-red-600">
          {errors.themeDefaults.join("; ")}
        </span>
      )}
      {errors.themeOverrides && (
        <span className="text-sm text-red-600">
          {errors.themeOverrides.join("; ")}
        </span>
      )}
    </div>
  );
}
