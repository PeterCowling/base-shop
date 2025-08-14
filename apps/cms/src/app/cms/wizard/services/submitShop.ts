// apps/cms/src/app/cms/wizard/services/submitShop.ts
"use client";

import {
  createShopOptionsSchema,
  type DeployStatusBase,
} from "@platform-core/createShop";
import { validateShopName } from "@platform-core/src/shops";
import { loadThemeTokens } from "../tokenUtils";
import type { WizardState } from "../schema";

export interface SubmitResult {
  ok: boolean;
  deployment?: DeployStatusBase;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function serializeNavItems(
  items: WizardState["navItems"]
): { label: string; url: string; children?: any[] }[] {
  return items.map(({ label, url, children }) => ({
    label,
    url,
    ...(children && children.length
      ? { children: serializeNavItems(children) }
      : {}),
  }));
}

export async function submitShop(
  shopId: string,
  state: WizardState
): Promise<SubmitResult> {
  try {
    validateShopName(shopId);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const {
    storeName,
    logo,
    contactInfo,
    type,
    template,
    theme,
    themeVars,
    payment,
    shipping,
    pageTitle,
    pageDescription,
    socialImage,
    navItems,
    pages,
    checkoutComponents,
    analyticsProvider,
    analyticsId,
    env,
  } = state;

  const defaults = await loadThemeTokens(theme);
  const themeOverrides = Object.fromEntries(
    Object.entries(themeVars ?? {}).filter(([k, v]) => defaults[k] !== v)
  );

  const options = {
    name: storeName || undefined,
    logo: logo || undefined,
    contactInfo: contactInfo || undefined,
    type,
    template,
    theme,
    themeOverrides,
    payment,
    shipping,
    analytics: analyticsProvider
      ? { provider: analyticsProvider, id: analyticsId || undefined }
      : undefined,
    pageTitle,
    pageDescription,
    socialImage: socialImage || undefined,
    navItems: serializeNavItems(navItems),
    pages: pages.map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      image: p.image,
      components: p.components,
    })),
    checkoutPage: checkoutComponents,
  };

  const parsed = createShopOptionsSchema.safeParse(options);
  if (!parsed.success) {
    const errs: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      errs[key] = [...(errs[key] ?? []), issue.message];
    }
    return { ok: false, fieldErrors: errs };
  }

  const res = await fetch("/cms/api/configurator", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: shopId, ...parsed.data }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    deployment?: DeployStatusBase;
    error?: string;
  };

  if (res.ok) {
    const errors: string[] = [];

    if (env && Object.keys(env).length > 0) {
      try {
        const envRes = await fetch(`/cms/api/env/${shopId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(env),
        });
        if (!envRes.ok) {
          const envJson = (await envRes.json().catch(() => ({}))) as {
            error?: string;
          };
          errors.push(envJson.error ?? "Failed to save environment variables");
        } else {
          const valRes = await fetch(
            `/cms/api/configurator/validate-env/${shopId}`
          );
          if (!valRes.ok) {
            const valJson = (await valRes.json().catch(() => ({}))) as {
              error?: string;
            };
            errors.push(valJson.error ?? "Environment validation failed");
          }
        }
      } catch {
        errors.push("Failed to save environment variables");
      }
    }

    try {
      const providerRes = await fetch(`/cms/api/providers/shop/${shopId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment, shipping }),
      });
      if (!providerRes.ok) {
        const providerJson = (await providerRes.json().catch(() => ({}))) as {
          error?: string;
        };
        errors.push(
          providerJson.error ?? "Failed to save provider configuration"
        );
      }
    } catch {
      errors.push("Failed to save provider configuration");
    }

    return {
      ok: errors.length === 0,
      deployment: json.deployment,
      ...(errors.length ? { error: errors.join("; ") } : {}),
    };
  }

  return { ok: false, error: json.error ?? "Failed to create shop" };
}

export interface PatchThemeResult {
  ok: boolean;
  error?: string;
  shop?: unknown;
}

export async function patchShopTheme(
  shopId: string,
  data: { themeOverrides: Record<string, string>; themeDefaults: Record<string, string> },
): Promise<PatchThemeResult> {
  try {
    const res = await fetch(`/cms/api/configure-shop/${shopId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      shop?: unknown;
      error?: string;
    };
    if (!res.ok || json.success === false) {
      return { ok: false, error: json.error ?? "Failed to update theme" };
    }
    return { ok: true, shop: json.shop };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
