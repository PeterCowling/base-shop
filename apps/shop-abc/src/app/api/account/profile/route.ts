// apps/shop-abc/src/app/api/account/profile/route.ts
import "@acme/lib/initZod";
import { getCustomerSession, hasPermission, validateCsrfToken } from "@auth";
import {
  getCustomerProfile,
  updateCustomerProfile,
} from "@acme/platform-core/customerProfiles";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";

export const runtime = "edge";

const schema = z
  .object({
    name: z.string().min(1),
    email: z.string().email(),
  })
  .strict();

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session.role, "view_profile")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const profile = await getCustomerProfile(session.customerId);
  if (!profile) {
    return NextResponse.json({
      ok: true,
      profile: { customerId: session.customerId, name: "", email: "" },
    });
  }

  return NextResponse.json({ ok: true, profile });
}

export async function PUT(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session.role, "manage_profile")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = req.headers.get("x-csrf-token");
  if (!token || !(await validateCsrfToken(token))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const parsed = await parseJsonBody(req, schema);
  if (!parsed.success) return parsed.response;
  try {
    await updateCustomerProfile(session.customerId, parsed.data);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Conflict:")) {
      return NextResponse.json(
        { error: err.message.replace("Conflict: ", "") },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
  const profile = await getCustomerProfile(session.customerId);
  return NextResponse.json({ ok: true, profile });
}

