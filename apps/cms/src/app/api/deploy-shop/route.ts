import {
  deployShopHosting,
  getDeployStatus,
} from "@cms/actions/deployShop.server";
import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { saveShopDomain } from "@platform-core/src/shops";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { id, domain } = body as { id: string; domain?: string };
    const res = await deployShopHosting(id, domain);

    if (domain) {
      try {
        await configureDomain(id, domain);
        await saveShopDomain(id, { domain });
      } catch (err) {
        console.error("Cloudflare domain setup failed", err);
      }
    }

    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const status = await getDeployStatus(id);
  return NextResponse.json(status);
}

async function configureDomain(shop: string, domain: string): Promise<void> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !zoneId || !accountId) {
    console.warn("Missing Cloudflare credentials");
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  } as const;

  const target = `${shop}.pages.dev`;

  await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      type: "CNAME",
      name: domain,
      content: target,
      ttl: 1,
      proxied: true,
    }),
  });

  await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${shop}/domains`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ name: domain }),
    }
  );
}
