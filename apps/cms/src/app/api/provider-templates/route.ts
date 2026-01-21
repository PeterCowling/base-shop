import { type NextRequest, NextResponse } from "next/server";

import {
  allProviderTemplates,
  getProviderTemplatesByProvider,
  paymentProviderTemplates,
  shippingProviderTemplates,
  taxProviderTemplates,
} from "@acme/templates";

/**
 * GET /cms/api/provider-templates
 *
 * Returns provider templates for payment, shipping, and tax integrations.
 * Used by the launch configurator to select provider configurations.
 *
 * Query parameters:
 * - category: "payment" | "shipping" | "tax" - Filter by provider category
 * - provider: string - Filter by specific provider (e.g., "stripe", "dhl")
 * - approved: "true" - Return only director-approved templates
 *
 * Examples:
 * - GET /api/provider-templates - All provider templates
 * - GET /api/provider-templates?category=payment - Payment providers only
 * - GET /api/provider-templates?category=shipping&approved=true - Approved shipping providers
 * - GET /api/provider-templates?provider=stripe - All Stripe templates
 */
export async function GET(req?: NextRequest) {
  const params = (() => {
    if (!req?.url) return { category: null, provider: null, approved: false };
    const { searchParams } = new URL(req.url);
    return {
      category: searchParams.get("category")?.toLowerCase() as
        | "payment"
        | "shipping"
        | "tax"
        | null,
      provider: searchParams.get("provider")?.toLowerCase() ?? null,
      approved: searchParams.get("approved") === "true",
    };
  })();

  let templates = (() => {
    // Filter by provider first if specified
    if (params.provider) {
      return getProviderTemplatesByProvider(params.provider);
    }

    // Filter by category
    switch (params.category) {
      case "payment":
        return paymentProviderTemplates;
      case "shipping":
        return shippingProviderTemplates;
      case "tax":
        return taxProviderTemplates;
      default:
        return allProviderTemplates;
    }
  })();

  // Apply director-approved filter
  if (params.approved) {
    templates = templates.filter((t) => t.directorApproved);
  }

  // Also filter by category if both provider and category specified
  if (params.provider && params.category) {
    templates = templates.filter((t) => t.category === params.category);
  }

  const response = templates.map((tpl) => ({
    id: tpl.id,
    version: tpl.version,
    provider: tpl.provider,
    label: tpl.label,
    description: tpl.description,
    category: tpl.category,
    capabilities: tpl.capabilities,
    requiredEnvVars: tpl.requiredEnvVars,
    optionalEnvVars: tpl.optionalEnvVars ?? [],
    requiredConfig: tpl.requiredConfig ?? [],
    webhookPath: tpl.webhookPath ?? null,
    docsUrl: tpl.docsUrl ?? null,
    supportedCurrencies: tpl.supportedCurrencies ?? [],
    supportedCountries: tpl.supportedCountries ?? [],
    directorApproved: tpl.directorApproved,
    origin: tpl.origin ?? "core",
  }));

  return NextResponse.json(response);
}
