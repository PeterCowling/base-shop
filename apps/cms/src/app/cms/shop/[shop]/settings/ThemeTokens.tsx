// apps/cms/src/app/cms/shop/[shop]/settings/ThemeTokens.tsx
"use client";
import { Button } from "@/components/atoms/shadcn";
import { resetThemeOverride } from "@cms/actions/shops.server";
import type { Shop } from "@acme/types";
import Link from "next/link";

interface TokenRow {
  token: string;
  defaultValue: string;
  overrideValue?: string;
}

interface Props {
  shop: string;
  tokenRows: TokenRow[];
  info: Shop;
  errors: Record<string, string[]>;
}

export default function ThemeTokens({ shop, tokenRows, info, errors }: Props) {
  return (
    <div className="col-span-2 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span>Theme Tokens</span>
        <Button
          asChild
          variant="ghost"
          className="h-auto p-0 text-primary hover:bg-transparent"
        >
          <Link href={`/cms/shop/${shop}/themes`}>Edit Theme</Link>
        </Button>
      </div>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="px-2 py-1">Token</th>
            <th className="px-2 py-1">Values</th>
            <th className="px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tokenRows.map(({ token, defaultValue, overrideValue }) => {
            const hasOverride = overrideValue !== undefined;
            const changed = hasOverride && overrideValue !== defaultValue;
            return (
              <tr key={token} className={changed ? "bg-yellow-50" : undefined}>
                <td className="border-t px-2 py-1 font-medium">{token}</td>
                <td className="border-t px-2 py-1">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className="font-mono">{defaultValue}</span>
                      <span className="text-xs text-muted-foreground">default</span>
                    </div>
                    {hasOverride && (
                      <div className="flex items-center gap-1">
                        <span className="font-mono">{overrideValue}</span>
                        <span className="text-xs text-muted-foreground">override</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="border-t px-2 py-1">
                  {hasOverride && (
                    <form action={resetThemeOverride.bind(null, shop, token)}>
                      <Button
                        type="submit"
                        variant="ghost"
                        className="h-auto p-0 text-primary hover:bg-transparent"
                      >
                        Reset
                      </Button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
