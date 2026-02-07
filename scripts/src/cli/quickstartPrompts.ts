// scripts/src/cli/quickstartPrompts.ts
// Prompt helpers for quickstart-shop.

import { join } from "node:path";

import { type CreateShopOptions,listThemes } from "@acme/platform-core/createShop";
import {
  listProviders,
  type ProviderInfo,
} from "@acme/platform-core/createShop/listProviders";

import { selectOption, selectProviders } from "../utils/prompts";
import {
  listDirNames,
  loadPresetDefaults,
  loadTemplateDefaults,
} from "../utils/templates";

import type { Flags } from "./parseQuickstartArgs";

export interface QuickstartPromptsResult {
  theme: string;
  template: string;
  navItems?: CreateShopOptions["navItems"];
  pages?: CreateShopOptions["pages"];
  payment: string[];
  shipping: string[];
  paymentProviders: ProviderInfo[];
  shippingProviders: ProviderInfo[];
  pageTemplate?: string;
}

export async function quickstartPrompts(
  args: Flags,
  config: Partial<CreateShopOptions>,
): Promise<QuickstartPromptsResult> {
  const themes = listThemes();
  let theme = args.theme ?? (config.theme as string | undefined);
  if (!theme) {
    theme = await selectOption(
      "theme",
      themes,
      Math.max(themes.indexOf("base"), 0),
    );
  }

  const templates = listDirNames(join(process.cwd(), "packages")).filter((n) =>
    n.startsWith("template-"),
  );
  let template = args.template ?? (config.template as string | undefined);
  if (!template) {
    template = await selectOption(
      "template",
      templates,
      Math.max(templates.indexOf("template-app"), 0),
    );
  }

  const templateDefaults = loadTemplateDefaults(template);
  const presetDefaults = args.presets ? loadPresetDefaults() : {};
  const navItems =
    (config.navItems as CreateShopOptions["navItems"] | undefined) ??
    templateDefaults.navItems ??
    presetDefaults.navItems;
  const pages =
    (config.pages as CreateShopOptions["pages"] | undefined) ??
    templateDefaults.pages ??
    presetDefaults.pages;

  const paymentProviders: ProviderInfo[] = await listProviders("payment");
  let payment =
    args.payment ??
    (Array.isArray(config.payment) ? (config.payment as string[]) : undefined);
  const shippingProviders: ProviderInfo[] = await listProviders("shipping");
  let shipping =
    args.shipping ??
    (Array.isArray(config.shipping) ? (config.shipping as string[]) : undefined);

  if (args.autoPlugins) {
    payment = paymentProviders.map((p) => p.id);
    shipping = shippingProviders.map((p) => p.id);
  } else {
    if (!payment || payment.length === 0) {
      payment = await selectProviders(
        "payment providers",
        paymentProviders.map((p) => p.id),
      );
    }

    if (!shipping || shipping.length === 0) {
      shipping = await selectProviders(
        "shipping providers",
        shippingProviders.map((p) => p.id),
      );
    }
  }

  const pageTemplate = args.pagesTemplate ?? (args.presets ? "default" : undefined);

  return {
    theme,
    template,
    navItems,
    pages,
    payment: payment ?? [],
    shipping: shipping ?? [],
    paymentProviders,
    shippingProviders,
    pageTemplate,
  };
}
