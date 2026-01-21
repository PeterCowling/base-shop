/// <reference types="@cloudflare/workers-types" />
// apps/api/src/routes/components/[shopId].ts

/* eslint-disable security/detect-non-literal-fs-filename -- ENG-1234: FS paths are constructed from validateShopName-guarded shop IDs, package names, and static repo directories; user input cannot control directory traversal */

import { existsSync, readFileSync, readdirSync } from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import { validateShopName } from "@acme/lib";
import { logger } from "@acme/lib/logger";
import {
  type RequestContext,
  withRequestContext,
} from "@acme/lib/context";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";

const SERVICE_NAME = "api";
const ENV_LABEL: "dev" | "stage" | "prod" =
  process.env.NODE_ENV === "production" ? "prod" : "dev";

interface ComponentChange {
  name: string;
  from: string | null;
  to: string;
  summary?: string;
  changelog?: string;
}

function resolveShopConfigId(shopId: string): string {
  return shopId === "bcd" ? "cover-me-pretty" : shopId;
}

function readJson<T = unknown>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

function extractSummary(log: string): string {
  for (const line of log.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    return trimmed;
  }
  return "";
}

function gatherChanges(shopId: string, root: string): ComponentChange[] {
  const configId = resolveShopConfigId(shopId);
  const shopJson = path.join(root, "data", "shops", configId, "shop.json");
  let stored: Record<string, string> = {};
  if (existsSync(shopJson)) {
    try {
      const shopData = readJson<{
        componentVersions?: Record<string, string>;
      }>(shopJson);
      stored = shopData.componentVersions ?? {};
    } catch {
      stored = {};
    }
  }
  const packagesDir = path.join(root, "packages");
  const changes: ComponentChange[] = [];
  for (const [pkgName, oldVersion] of Object.entries(stored)) {
    const dir = path.join(packagesDir, pkgName.replace(/^@[^/]+\//, ""));
    const pkgJson = path.join(dir, "package.json");
    if (!existsSync(pkgJson)) continue;
    const pkg = readJson<{ name?: string; version?: string }>(pkgJson);
    const latest = pkg.version;
    if (!latest || latest === oldVersion) continue;
    const changelogPath = path.join(dir, "CHANGELOG.md");
    let summary = "";
    let changelog = "";
    if (existsSync(changelogPath)) {
      summary = extractSummary(readFileSync(changelogPath, "utf8"));
      changelog = path.relative(root, changelogPath);
    }
    changes.push({
      name: pkg.name || pkgName,
      from: oldVersion ?? null,
      to: latest,
      summary,
      changelog,
    });
  }
  return changes;
}

function listFiles(dir: string, base = ""): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(path.join(dir, entry.name), rel));
    } else {
      files.push(rel);
    }
  }
  return files;
}

function diffDirectories(a: string, b: string): string[] {
  const files = new Set([...listFiles(a), ...listFiles(b)]);
  const changed: string[] = [];
  for (const file of files) {
    const fileA = path.join(a, file);
    const fileB = path.join(b, file);
    const hasA = existsSync(fileA);
    const hasB = existsSync(fileB);
    if (!hasA || !hasB) {
      changed.push(file);
      continue;
    }
    const bufA = readFileSync(fileA);
    const bufB = readFileSync(fileB);
    if (!bufA.equals(bufB)) changed.push(file);
  }
  return changed;
}

export const onRequest = async ({
  params,
  request,
}: {
  params: Record<string, string>;
  request: Request;
}) => {
  const requestId =
    request.headers.get("x-request-id") ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`);

  const ctx: RequestContext = {
    requestId,
    env: ENV_LABEL,
    service: SERVICE_NAME,
    shopId: params.shopId,
  };

  return withRequestContext(ctx, () =>
    handleRequest({
      params,
      request,
    }),
  );
};

async function handleRequest({
  params,
  request,
}: {
  params: Record<string, string>;
  request: Request;
}) {
  const t = await getServerTranslations("en");
  let shopId: string;
  try {
    shopId = validateShopName(params.shopId);
  } catch {
    logger.warn("invalid shop id", { id: params.shopId, service: SERVICE_NAME, env: ENV_LABEL }); // i18n-exempt -- ENG-1234 developer log label [ttl=2026-12-31]
    return new Response(JSON.stringify({ error: t("api.components.invalidShopId") }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    logger.warn("missing bearer token", { shopId, service: SERVICE_NAME, env: ENV_LABEL }); // i18n-exempt -- ENG-1234 developer log label [ttl=2026-12-31]
    return new Response(JSON.stringify({ error: t("api.common.forbidden") }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = authHeader.slice("Bearer ".length);
  const secret = process.env.UPGRADE_PREVIEW_TOKEN_SECRET;
  if (!secret) {
    logger.warn("invalid token", { shopId, service: SERVICE_NAME, env: ENV_LABEL }); // i18n-exempt -- ENG-1234 developer log label [ttl=2026-12-31]
    return new Response(JSON.stringify({ error: t("api.common.forbidden") }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const payload = jwt.verify(
      token,
      secret,
      {
        algorithms: ["HS256"],
        audience: "upgrade-preview",
        issuer: "acme",
        subject: `shop:${shopId}:upgrade-preview`,
      },
    ) as jwt.JwtPayload;
    if (typeof payload.exp !== "number") {
      throw new Error("missing exp");
    }
  } catch {
    logger.warn("invalid token", { shopId, service: SERVICE_NAME, env: ENV_LABEL }); // i18n-exempt -- ENG-1234 developer log label [ttl=2026-12-31]
    return new Response(JSON.stringify({ error: t("api.common.forbidden") }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const root = path.resolve(__dirname, "../../../../../..");
  const components = gatherChanges(shopId, root);

  const includeDiff = new URL(request.url).searchParams.has("diff");
  if (!includeDiff) {
    return new Response(JSON.stringify({ components }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const appDirCandidates = [
    ...(shopId === "bcd" ? [path.join(root, "apps", "cover-me-pretty")] : []),
    path.join(root, "apps", shopId),
    path.join(root, "apps", `shop-${shopId}`),
  ];
  const appDir =
    appDirCandidates.find((dir) => existsSync(dir)) ??
    appDirCandidates[appDirCandidates.length - 1];
  const templateDir = path.join(root, "packages", "template-app");
  const configDiff = {
    templates: diffDirectories(
      path.join(appDir, "src", "templates"),
      path.join(templateDir, "src", "templates"),
    ),
    translations: diffDirectories(
      path.join(appDir, "src", "translations"),
      path.join(templateDir, "src", "translations"),
    ),
  };
  return new Response(JSON.stringify({ components, configDiff }), {
    headers: { "Content-Type": "application/json" },
  });
};

export { extractSummary, gatherChanges, diffDirectories, listFiles };
