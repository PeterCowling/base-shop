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
  } = state;

  const options = {
    name: storeName || undefined,
    logo: logo || undefined,
    contactInfo: contactInfo || undefined,
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
    navItems: navItems.map((n) => ({ label: n.label, url: n.url })),
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
    await fetch(`/cms/api/providers/shop/${shopId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment, shipping }),
    }).catch(() => undefined);
    return { ok: true, deployment: json.deployment };
  }

  return { ok: false, error: json.error ?? "Failed to create shop" };
}

