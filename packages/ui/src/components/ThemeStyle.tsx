// packages/ui/src/components/ThemeStyle.tsx
import * as React from "react";
import { readShop } from "@acme/platform-core/repositories/shops.server";

function firstFamilyFromStack(stack?: string): string | null {
  if (!stack) return null;
  const m = stack.match(/"([^"]+)"/);
  if (m) return m[1];
  const first = stack.split(",")[0]?.trim();
  if (!first || first.startsWith("var(")) return null;
  return first.replace(/^["']|["']$/g, "");
}

function googleHref(name: string): string {
  return `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, "+")}&display=swap`;
}

export interface ThemeStyleProps {
  /**
   * Shop id whose theme tokens should be injected. When omitted, you must
   * provide `tokens` directly.
   */
  shopId?: string;
  /**
   * Optional pre-resolved token map to inject. If provided, `shopId` is not
   * required and no server fetch occurs.
   */
  tokens?: Record<string, string>;
}

/**
 * Server component that injects theme tokens as CSS custom properties and
 * emits Google Font links for heading/body families.
 */
export default async function ThemeStyle({ shopId, tokens: propTokens }: ThemeStyleProps): Promise<React.ReactElement | null> {
  let tokens = propTokens ?? {};
  if (!propTokens) {
    if (!shopId) return null;
    const data = await readShop(shopId);
    tokens = data.themeTokens ?? {};
  }

  const entries = Object.entries(tokens) as Array<[string, string]>;
  if (entries.length === 0) return null;

  const cssVars = entries
    .map(([k, v]) => `${k}: ${v};`)
    .join("\n  ");

  // Alias: make font-sans follow the selected body font for Tailwind coverage
  const extra = tokens["--font-body"] ? `\n  --font-sans: var(--font-body);` : "";
  const css = `:root{\n  ${cssVars}${extra}\n}`;

  const body = firstFamilyFromStack(tokens["--font-body"]);
  const h1 = firstFamilyFromStack(tokens["--font-heading-1"]);
  const h2 = firstFamilyFromStack(tokens["--font-heading-2"]);
  const uniqueFamilies = Array.from(new Set([body, h1, h2].filter(Boolean))) as string[];

  return (
    <>
      {/* Font loading performance hints */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {uniqueFamilies.map((name) => (
        <link key={name} rel="stylesheet" href={googleHref(name)} />
      ))}
      <style data-shop-theme dangerouslySetInnerHTML={{ __html: css }} />
    </>
  );
}
