import {
  deployShopHosting,
  getDeployStatus,
} from "@cms/actions/deployShop.server";
import { saveShopDomain } from "@platform-core/src/shops";
import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

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
      const dnsRecordId = await createDnsRecord(domain, `${id}.pages.dev`);
      const certificateId = await issueCertificate(domain);
      await saveShopDomain(id, { name: domain, dnsRecordId, certificateId });
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

async function createDnsRecord(domain: string, target: string): Promise<string> {
  const zone = process.env.CF_ZONE_ID;
  const token = process.env.CF_API_TOKEN;
  if (!zone || !token) throw new Error("Missing Cloudflare configuration");
  const resp = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type: "CNAME", name: domain, content: target }),
    }
  );
  const json = await resp.json();
  if (!json.success) throw new Error("Failed to create DNS record");
  return json.result.id as string;
}

async function issueCertificate(domain: string): Promise<string> {
  const zone = process.env.CF_ZONE_ID;
  const token = process.env.CF_API_TOKEN;
  if (!zone || !token) throw new Error("Missing Cloudflare configuration");
  const resp = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zone}/custom_hostnames`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ hostname: domain }),
    }
  );
  const json = await resp.json();
  if (!json.success) throw new Error("Failed to issue certificate");
  return json.result.id as string;
}
