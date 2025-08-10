import {
  deployShopHosting,
  getDeployStatus,
  updateDeployStatus,
} from "@cms/actions/deployShop.server";
import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

async function createCloudflareRecords(
  shopId: string,
  domain: string
): Promise<{ status?: string; cnameTarget?: string }> {
  const account =
    process.env.CLOUDFLARE_ACCOUNT_ID ||
    process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID;
  const token =
    process.env.CLOUDFLARE_API_TOKEN ||
    process.env.NEXT_PUBLIC_CLOUDFLARE_API_TOKEN;
  const zone =
    process.env.CLOUDFLARE_ZONE_ID ||
    process.env.NEXT_PUBLIC_CLOUDFLARE_ZONE_ID;
  if (!account || !token) {
    throw new Error("Cloudflare credentials not configured");
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${shopId}/domains`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: domain }),
    }
  );

  const json = (await res.json()) as any;
  if (!res.ok) {
    throw new Error(json.errors?.[0]?.message ?? "Failed to provision domain");
  }

  const cnameTarget = json.result?.verification_data?.cname_target as
    | string
    | undefined;

  if (zone && cnameTarget) {
    try {
      await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/dns_records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "CNAME",
          name: domain,
          content: cnameTarget,
          ttl: 1,
          proxied: true,
        }),
      });
    } catch {
      /* ignore DNS record errors */
    }
  }

  try {
    await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${shopId}/domains/${domain}/certificates`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch {
    /* ignore certificate errors */
  }

  return {
    status: json.result?.status as string | undefined,
    cnameTarget,
  };
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { id, domain } = body as { id: string; domain?: string };
    let res = await deployShopHosting(id, domain);
    if (domain) {
      try {
        const cf = await createCloudflareRecords(id, domain);
        res = {
          ...res,
          domain,
          domainStatus: cf.status,
          instructions: cf.cnameTarget
            ? `Add a CNAME record for ${domain} pointing to ${cf.cnameTarget}`
            : res.instructions,
        } as typeof res & { domain?: string; domainStatus?: string };
        await updateDeployStatus(id, {
          ...res,
          domain,
          domainStatus: cf.status,
          instructions: res.instructions,
        });
      } catch (err) {
        return NextResponse.json(
          { error: (err as Error).message },
          { status: 400 }
        );
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

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { id, ...data } = body as {
      id: string;
      domain?: string;
      domainStatus?: string;
      instructions?: string;
    } & Record<string, unknown>;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    await updateDeployStatus(id, data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
