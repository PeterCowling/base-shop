// apps/shop-bcd/src/app/api/account/profile/route.ts
import "@acme/zod-utils/initZod";
import { getCustomerSession } from "@auth";
import {
  getCustomerProfile,
  updateCustomerProfile,
} from "@platform-core/customerProfiles";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";

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

async function loadProfile(customerId: string) {
  try {
    return await getCustomerProfile(customerId);
  } catch (err) {
    if (err instanceof Error && err.message === "Customer profile not found") {
      return null;
    }
    throw err;
  }
}

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await loadProfile(session.customerId);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, profile });
}

export async function PUT(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }

  const profile = await loadProfile(session.customerId);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, profile });
}

