/**
 * apply-prime-zone-hardening.ts
 *
 * Applies Cloudflare zone hardening settings to hostel-positano.com.
 *
 * Settings applied:
 *   ssl              → "strict"  (Full strict — CF validates CF-issued cert on origin)
 *   min_tls_version  → "1.2"     (reject TLS 1.0 / 1.1 handshakes)
 *   always_use_https → "on"      (HTTP → HTTPS redirect at edge)
 *
 * Usage:
 *   pnpm --filter scripts prime:apply-zone-hardening [--dry-run] [--rollback] [--zone <name>]
 *
 *   --dry-run   Read and print current settings only. No PATCH requests.
 *   --rollback  Restore prior state: ssl=flexible, min_tls_version=1.0, always_use_https=off.
 *   --zone      Override zone name (default: hostel-positano.com).
 *
 * Environment:
 *   CLOUDFLARE_API_TOKEN  CF API token with Zone:Read + Zone Settings:Edit permissions.
 *                         Scope: hostel-positano.com zone only.
 *
 * Token creation: CF dashboard → API Tokens → Create Custom Token
 *   → Zone:Read permission
 *   → Zone Settings:Edit permission
 *   → Zone Resources: Include → Specific zone → hostel-positano.com
 *   Do NOT use the "Edit zone DNS" template — it grants unnecessary DNS write privilege.
 */

import { resolveZoneTag } from "../brikette/cloudflare-analytics-client.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CfApiResponse<T> = {
  success: boolean;
  errors: Array<{ code?: number; message?: string }>;
  result: T;
};

type ZoneSetting = {
  id: string;
  value: string | boolean;
  editable?: boolean;
};

type CertificatePack = {
  id: string;
  status: string;
  type: string;
  hosts?: string[];
  certificates?: Array<{ hosts?: string[] }>;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_ZONE = "hostel-positano.com";

/** Hostname whose managed cert must be active before applying SSL mode changes. */
const CERT_HOSTNAME = "guests.hostel-positano.com";

/** Target settings applied in this order (order matters — ssl before min_tls). */
const HARDENING_SETTINGS = [
  { name: "ssl", value: "strict" },
  { name: "min_tls_version", value: "1.2" },
  { name: "always_use_https", value: "on" },
] as const;

/** Rollback values to restore previous state if hardening causes issues. */
const ROLLBACK_SETTINGS = [
  { name: "ssl", value: "flexible" },
  { name: "min_tls_version", value: "1.0" },
  { name: "always_use_https", value: "off" },
] as const;

// ---------------------------------------------------------------------------
// CF REST helpers
// ---------------------------------------------------------------------------

async function cfGet<T>(token: string, path: string): Promise<CfApiResponse<T>> {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "(no body)");
    const hint =
      response.status === 403
        ? " — check that your token has Zone:Read permission scoped to this zone"
        : "";
    throw new Error(`CF API GET ${path} failed: HTTP ${response.status}${hint}\n${body}`);
  }
  return (await response.json()) as CfApiResponse<T>;
}

async function cfPatch<T>(
  token: string,
  path: string,
  body: unknown,
): Promise<CfApiResponse<T>> {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "(no body)");
    const hint =
      response.status === 403
        ? " — check that your token has Zone Settings:Edit permission"
        : "";
    throw new Error(`CF API PATCH ${path} failed: HTTP ${response.status}${hint}\n${text}`);
  }
  const payload = (await response.json()) as CfApiResponse<T>;
  if (!payload.success) {
    const messages = (payload.errors ?? [])
      .map((e) => `[${e.code ?? "?"}] ${e.message ?? "unknown error"}`)
      .join("; ");
    throw new Error(`CF API PATCH ${path} returned success=false: ${messages}`);
  }
  return payload;
}

// ---------------------------------------------------------------------------
// Pre-flight: confirm a managed cert covers CERT_HOSTNAME
// ---------------------------------------------------------------------------

async function verifyManagedCert(token: string, zoneId: string): Promise<void> {
  console.log(`\nPre-flight: checking managed cert for ${CERT_HOSTNAME}...`);
  const payload = await cfGet<CertificatePack[]>(
    token,
    `/zones/${zoneId}/ssl/certificate_packs`,
  );
  if (!payload.success) {
    const messages = (payload.errors ?? []).map((e) => e.message ?? "unknown").join("; ");
    throw new Error(`certificate_packs query failed: ${messages}`);
  }

  const packs = payload.result ?? [];
  const active = packs.find((pack) => {
    // Collect all hostnames this pack covers
    const hosts: string[] = [...(pack.hosts ?? [])];
    for (const cert of pack.certificates ?? []) {
      hosts.push(...(cert.hosts ?? []));
    }
    const coversHost =
      hosts.includes(CERT_HOSTNAME) || hosts.includes(`*.hostel-positano.com`);
    const isActive = pack.status === "active" || pack.status === "pending_issuance";
    return coversHost && isActive;
  });

  if (!active) {
    throw new Error(
      [
        `Managed cert not found for ${CERT_HOSTNAME}; aborting.`,
        `To activate: CF dashboard → Pages → prime → Custom Domains → Add domain.`,
        `Cert provisioning may take up to 24 hours.`,
        `Run --dry-run once the cert is active to verify before applying settings.`,
      ].join("\n"),
    );
  }

  console.log(`  OK — cert found (status: ${active.status}, type: ${active.type})`);
}

// ---------------------------------------------------------------------------
// Read current zone settings
// ---------------------------------------------------------------------------

async function readCurrentSettings(
  token: string,
  zoneId: string,
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  for (const { name } of HARDENING_SETTINGS) {
    const payload = await cfGet<ZoneSetting>(token, `/zones/${zoneId}/settings/${name}`);
    if (!payload.success) {
      const messages = (payload.errors ?? []).map((e) => e.message ?? "unknown").join("; ");
      throw new Error(`Failed to read setting "${name}": ${messages}`);
    }
    results[name] = String(payload.result?.value ?? "(none)");
  }
  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const rollback = args.includes("--rollback");
  const zoneIdx = args.indexOf("--zone");
  const zoneName =
    zoneIdx >= 0 && args[zoneIdx + 1] ? (args[zoneIdx + 1] as string) : DEFAULT_ZONE;

  const token = process.env["CLOUDFLARE_API_TOKEN"];
  if (!token) {
    console.error(
      "Error: CLOUDFLARE_API_TOKEN is not set.\n" +
        "Run: source .env.local\n" +
        "Then: pnpm --filter scripts prime:apply-zone-hardening",
    );
    process.exit(1);
  }

  const targetSettings = rollback ? ROLLBACK_SETTINGS : HARDENING_SETTINGS;
  const modeLabel = dryRun ? "DRY RUN" : rollback ? "ROLLBACK" : "LIVE";

  console.log(`\n=== CF Zone Hardening [${modeLabel}] ===`);
  console.log(`Zone:     ${zoneName}`);
  console.log(`Settings: ${targetSettings.map((s) => `${s.name}=${s.value}`).join(", ")}`);

  // 1. Resolve zone ID
  let zoneId: string;
  try {
    zoneId = await resolveZoneTag(token, undefined, zoneName);
    console.log(`Zone ID:  ${zoneId}`);
  } catch (err) {
    console.error(`\nFailed to resolve zone: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  // 2. Pre-flight cert check (hardening only — rollback must always be able to proceed)
  if (!dryRun && !rollback) {
    try {
      await verifyManagedCert(token, zoneId);
    } catch (err) {
      console.error(`\n${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  }

  // 3. Read current settings
  console.log(`\nCurrent settings:`);
  try {
    const current = await readCurrentSettings(token, zoneId);
    for (const [k, v] of Object.entries(current)) {
      const target = targetSettings.find((s) => s.name === k)?.value;
      const already = target !== undefined && v === target ? " (already at target)" : "";
      console.log(`  ${k}: ${v}${already}`);
    }
  } catch (err) {
    console.error(
      `\nFailed to read settings: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }

  if (dryRun) {
    console.log(`\n[DRY RUN] No changes applied.`);
    return;
  }

  // 4. Apply settings sequentially; report partial state on failure
  console.log(`\nApplying settings...`);
  const applied: string[] = [];
  const failed: string[] = [];

  for (const setting of targetSettings) {
    process.stdout.write(`  PATCH ${setting.name} = ${setting.value} ... `);
    try {
      await cfPatch<ZoneSetting>(token, `/zones/${zoneId}/settings/${setting.name}`, {
        value: setting.value,
      });

      // Read back to confirm the write was accepted
      const confirm = await cfGet<ZoneSetting>(
        token,
        `/zones/${zoneId}/settings/${setting.name}`,
      );
      const readBack = String(confirm.result?.value ?? "(none)");
      if (readBack !== setting.value) {
        throw new Error(`read-back mismatch: expected "${setting.value}", got "${readBack}"`);
      }
      console.log(`OK (confirmed ${readBack})`);
      applied.push(`${setting.name}=${setting.value}`);
    } catch (err) {
      console.log(`FAILED`);
      console.error(`    ${err instanceof Error ? err.message : String(err)}`);
      failed.push(setting.name);
      // Continue to surface all failures before exiting
    }
  }

  // 5. Summary
  console.log(`\nResults:`);
  if (applied.length > 0) console.log(`  Applied: ${applied.join(", ")}`);
  if (failed.length > 0) console.log(`  Failed:  ${failed.join(", ")}`);

  if (failed.length > 0) {
    console.error(
      `\nPartial failure: ${failed.length} setting(s) not applied. Zone may be in an intermediate state.`,
    );
    console.error(
      `Run with --dry-run to check current state, then re-run to complete or use --rollback to revert.`,
    );
    process.exit(1);
  }

  console.log(`\nAll settings applied successfully.`);

  if (!rollback) {
    console.log(`\nSmoke tests — run these to verify:`);
    console.log(`  curl -sv https://guests.hostel-positano.com 2>&1 | grep "TLSv"`);
    console.log(`  curl -I http://guests.hostel-positano.com            # expect 301 → https`);
    console.log(
      `  curl -sv https://www.hostel-positano.com 2>&1 | grep "TLSv"  # brikette also OK`,
    );
    console.log(
      `  curl --tls-max 1.1 https://guests.hostel-positano.com        # expect SSL error`,
    );
  }
}

main().catch((err) => {
  console.error(`Unhandled error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
