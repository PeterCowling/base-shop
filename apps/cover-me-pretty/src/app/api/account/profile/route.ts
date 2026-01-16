// i18n-exempt file -- ABC-123 [ttl=2025-06-30]
// apps/cover-me-pretty/src/app/api/account/profile/route.ts
import "@acme/zod-utils/initZod";
import { getCustomerSession } from "@acme/auth";
import {
  getCustomerProfile,
  updateCustomerProfile,
} from "@acme/platform-core/customerProfiles";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@acme/shared-utils";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";

// This route uses @auth which relies on Node.js APIs like `crypto`.
// The Edge runtime does not provide these modules, so we must opt into
// the Node.js runtime to ensure the build succeeds.
export const runtime = "nodejs";

const schema = z
  .object({
    name: z.string().min(1),
    email: z.string().email(),
  })
  .strict();

export async function GET() {
  const t = await getServerTranslations("en");
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: t("api.account.unauthorized") }, { status: 401 });
  }

  let profile;
  try {
    profile = await getCustomerProfile(session.customerId);
  } catch (err) {
    if (
      err instanceof Error &&
      err.message === "Customer profile not found" // i18n-exempt -- ABC-123 error discriminator string from backend [ttl=2025-06-30]
    ) {
      return NextResponse.json({ error: t("api.account.profileNotFound") }, { status: 404 });
    }
    throw err;
  }
  if (!profile) {
    return NextResponse.json({ error: t("api.account.profileNotFound") }, { status: 404 });
  }

  return NextResponse.json({ ok: true, profile });
}

export async function PUT(req: NextRequest) {
  const t = await getServerTranslations("en");
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: t("api.account.unauthorized") }, { status: 401 });
  }

  const parsed = await parseJsonBody(req, schema, "1mb");
  if ("response" in parsed) {
    return parsed.response;
  }

  try {
    await updateCustomerProfile(
      session.customerId,
      parsed.data as { name: string; email: string },
    );
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Conflict")) {
      // i18n-exempt -- ABC-123 backend conflict message is passed through for debugging [ttl=2025-06-30]
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
  let profile;
  try {
    profile = await getCustomerProfile(session.customerId);
  } catch (err) {
    if (
      err instanceof Error &&
      err.message === "Customer profile not found" // i18n-exempt -- ABC-123 error discriminator string from backend [ttl=2025-06-30]
    ) {
      return NextResponse.json({ error: t("api.account.profileNotFound") }, { status: 404 });
    }
    throw err;
  }
  if (!profile) {
    return NextResponse.json({ error: t("api.account.profileNotFound") }, { status: 404 });
  }
  return NextResponse.json({ ok: true, profile });
}
