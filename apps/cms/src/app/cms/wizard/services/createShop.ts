"use client";

import { createShopOptionsSchema } from "@platform-core/createShop/schema";
import type { DeployStatusBase } from "@platform-core/createShop/deployTypes";
import { validateShopName } from "@platform-core/shops";
import type { WizardState } from "../schema";

interface SerializedNavItem {
  label: string;
  url: string;
  children?: SerializedNavItem[];
}

export interface CreateResult {
  ok: boolean;
  deployment?: DeployStatusBase;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function serializeNavItems(
  items: WizardState["navItems"]
): SerializedNavItem[] {
  return items.map(
    ({ label, url, children }: WizardState["navItems"][number]) => ({
      label,
      url,
      ...(children && children.length
        ? { children: serializeNavItems(children) }
        : {}),
    })
  );
}

export async function createShop(
  shopId: string,
  state: WizardState
): Promise<CreateResult> {
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
    theme,
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
  } = state;

  const options = {
    name: storeName || undefined,
    logo:
      typeof logo === "string"
        ? logo || undefined
        : Object.keys(logo).length
          ? logo
          : undefined,
    contactInfo: contactInfo || undefined,
    type,
    theme,
    payment,
    shipping,
    analytics: analyticsProvider
      ? { provider: analyticsProvider, id: analyticsId || undefined }
      : undefined,
    pageTitle,
    pageDescription,
    socialImage: socialImage || undefined,
    navItems: serializeNavItems(navItems),
    pages: pages.map((p: WizardState["pages"][number]) => ({
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
    return { ok: true, deployment: json.deployment };
  }

  return {
    ok: false,
    // i18n-exempt: generic fallback when API provides no message; surfaced in UI as-is
    error: json.error ?? "Failed to create shop",
  };
}
