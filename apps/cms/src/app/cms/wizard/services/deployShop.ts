// apps/cms/src/app/cms/wizard/services/deployShop.ts
"use client";

import { validateShopName } from "@acme/platform-core/shops/client";

interface DeployStatusBase {
  status: "pending" | "success" | "error";
  previewUrl?: string;
  instructions?: string;
  error?: string;
}

export interface DeployInfo extends DeployStatusBase {
  domainStatus?: string;
  certificateStatus?: string;
}

export interface DeployResult {
  ok: boolean;
  info?: DeployInfo;
  error?: string;
}

export async function deployShop(
  shopId: string,
  domain: string,
  env: "dev" | "stage" | "prod" = "stage"
): Promise<DeployResult> {
  try {
    validateShopName(shopId);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const res = await fetch("/cms/api/configurator/deploy-shop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // For now, treat configurator-initiated deploys as targeting the
    // "stage" environment; this can be made configurable in the UI later.
    body: JSON.stringify({ id: shopId, domain, env }),
  });

  const json = (await res.json()) as DeployInfo;

  if (!res.ok) {
    return {
      ok: false,
      // i18n-exempt: generic fallback when API provides no message; surfaced in UI as-is
      error: json.error ?? "Deployment failed",
    };
  }

  let info: DeployInfo = json;

  if (domain) {
    try {
      const cfRes = await fetch("/cms/api/cloudflare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: shopId, domain }),
      });
      const cfJson = (await cfRes.json()) as {
        status?: string;
        certificateStatus?: string;
        error?: string;
      };
      if (!cfRes.ok) {
        // i18n-exempt: backend provisioning error fallback; shown in UI unchanged
        throw new Error(cfJson.error ?? "Failed to provision domain");
      }
      info = {
        ...json,
        domainStatus: cfJson.status ?? json.domainStatus,
        certificateStatus: cfJson.certificateStatus,
      };

      await fetch("/cms/api/configurator/deploy-shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: shopId,
          domain,
          domainStatus: cfJson.status,
          certificateStatus: cfJson.certificateStatus,
        }),
      });
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return { ok: true, info };
}

export async function getDeployStatus(shopId: string): Promise<DeployInfo> {
  const res = await fetch(`/cms/api/configurator/deploy-shop?id=${shopId}`);
  return (await res.json()) as DeployInfo;
}
