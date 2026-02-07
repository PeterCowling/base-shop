import "@acme/zod-utils/initZod";

import { NextResponse } from "next/server";

import { getRapidLaunchThemes } from "@acme/platform-core/themeRegistry";
import {
  getRapidLaunchLegalBundles,
  getRapidLaunchTemplates,
  pickRapidLaunchLegalBundle,
  pickRapidLaunchTemplate,
} from "@acme/templates";

import { ensureCanRead } from "@/actions/common/auth";

export async function GET() {
  try {
    await ensureCanRead();

    const themes = getRapidLaunchThemes();
    const paymentTemplates = getRapidLaunchTemplates("payment");
    const shippingTemplates = getRapidLaunchTemplates("shipping");
    const taxTemplates = getRapidLaunchTemplates("tax");
    const legalBundles = getRapidLaunchLegalBundles();

    const defaultTheme = themes[0] ?? null;
    const defaultPayment = pickRapidLaunchTemplate("payment") ?? null;
    const defaultShipping = pickRapidLaunchTemplate("shipping") ?? null;
    const defaultTax = pickRapidLaunchTemplate("tax") ?? null;
    const defaultLegal = pickRapidLaunchLegalBundle() ?? null;

    return NextResponse.json({
      defaults: {
        themeId: defaultTheme?.id ?? "",
        paymentTemplateId: defaultPayment?.id ?? "",
        shippingTemplateId: defaultShipping?.id ?? "",
        taxTemplateId: defaultTax?.id ?? "",
        legalBundleId: defaultLegal?.id ?? "",
        consentTemplateId: defaultLegal?.documents.consent.id ?? "",
      },
      options: {
        themes,
        paymentTemplates,
        shippingTemplates,
        taxTemplates,
        legalBundles: legalBundles.map((bundle) => ({
          id: bundle.id,
          name: bundle.name,
          approved: bundle.approved,
          rapidLaunch: bundle.rapidLaunch,
          rapidLaunchOrder: bundle.rapidLaunchOrder,
          consentId: bundle.documents.consent.id,
        })),
        consentTemplates: legalBundles.map((bundle) => bundle.documents.consent),
      },
    });
  } catch (err) {
    const message = (err as Error).message || "Failed to load rapid launch defaults";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
