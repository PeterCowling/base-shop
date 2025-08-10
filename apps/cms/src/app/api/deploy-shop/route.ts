import {
  deployShopHosting,
  getDeployStatus,
} from "@cms/actions/deployShop.server";
import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { writeShopDomain } from "@platform-core/src/shops";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { id, domain } = body as { id: string; domain?: string };
    const res = await deployShopHosting(id, domain);

    let dnsRecordId: string | undefined;
    let certificateId: string | undefined;

    if (domain) {
      const token = process.env.CLOUDFLARE_API_TOKEN;
      const zone = process.env.CLOUDFLARE_ZONE_ID;
      if (token && zone) {
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };
        const base = "https://api.cloudflare.com/client/v4";

        try {
          const dnsRes = await fetch(
            `${base}/zones/${zone}/dns_records`,
            {
              method: "POST",
              headers,
              body: JSON.stringify({
                type: "CNAME",
                name: domain,
                content: `${id}.pages.dev`,
                ttl: 1,
                proxied: true,
              }),
            }
          );
          const dnsJson = (await dnsRes
            .json()
            .catch(() => ({}))) as { result?: { id: string } };
          dnsRecordId = dnsJson.result?.id;

          const certRes = await fetch(
            `${base}/zones/${zone}/custom_hostnames`,
            {
              method: "POST",
              headers,
              body: JSON.stringify({
                hostname: domain,
                ssl: { method: "txt", type: "dv", wildcard: false },
              }),
            }
          );
          const certJson = (await certRes
            .json()
            .catch(() => ({}))) as { result?: { id: string } };
          certificateId = certJson.result?.id;

          await writeShopDomain(id, {
            domain,
            dnsRecordId,
            certificateId,
          });
        } catch {
          // ignore Cloudflare errors
        }
      }
    }

    return NextResponse.json({ ...res, dnsRecordId, certificateId });
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
