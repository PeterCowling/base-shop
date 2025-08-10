// apps/cms/src/app/cms/wizard/services/submitShop.ts
"use client";

import { createShopOptionsSchema, type DeployStatusBase } from "@platform-core/createShop";
import { validateShopName } from "@platform-core/src/shops";
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

  const options = {
    name: storeName || undefined,
    logo: logo || undefined,
    contactInfo: contactInfo || undefined,
    type,
    template,
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

  const res = await fetch("/cms/api/create-shop", {
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
    if (env && Object.keys(env).length > 0) {
      await fetch(`/cms/api/env/${shopId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(env),
      }).catch(() => undefined);
    }
    await fetch(`/cms/api/providers/shop/${shopId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment, shipping }),
    }).catch(() => undefined);
    return { ok: true, deployment: json.deployment };
  }

  return { ok: false, error: json.error ?? "Failed to create shop" };
}

