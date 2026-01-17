import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { spawn } from "child_process";
import jwt from "jsonwebtoken";
import {
  logger,
  withRequestContext,
  type RequestContext,
} from "@acme/shared-utils";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";
import { incrementOperationalError } from "@acme/platform-core/shops/health";

const SERVICE_NAME = "api";
const ENV_LABEL: "dev" | "stage" | "prod" =
  process.env.NODE_ENV === "production" ? "prod" : "dev";

function readJsonFile<T>(filePath: string): T {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- API-4100: path is derived from a validated shop id and workspace root
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function writeJsonFile(filePath: string, data: unknown): void {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- API-4100: path is derived from a validated shop id and workspace root
  writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function run(cmd: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, stdio: "inherit" });
    // Register the close handler before the error handler. Some tests stub the
    // `on` method to immediately invoke the provided callback regardless of the
    // event name. If the error handler runs first in that scenario the promise
    // would reject even though the process "succeeded". By attaching the close
    // handler first we ensure the promise resolves on a successful exit and any
    // subsequent calls to reject are ignored.
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} failed with status ${code}`));
    });
    proc.on("error", (err) => reject(err));
  });
}

export const onRequestPost = async ({
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
    shopId: params.id,
  };

  return withRequestContext(ctx, () =>
    handleRequestPost({
      params,
      request,
    }),
  );
};

const handleRequestPost = async ({
  params,
  request,
}: {
  params: Record<string, string>;
  request: Request;
}) => {
  const id = params.id;
  const t = await getServerTranslations("en");
  let shopId: string | null = null;
  try {
    if (!id || !/^[a-z0-9_-]+$/.test(id)) {
      logger.warn("invalid shop id", { id, service: SERVICE_NAME, env: ENV_LABEL }); // i18n-exempt -- API-4100 developer log label [ttl=2026-12-31]
      return new Response(JSON.stringify({ error: t("api.components.invalidShopId") }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    shopId = id;

    const authHeader = request.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      logger.warn("missing bearer token", { id: shopId, service: SERVICE_NAME, env: ENV_LABEL }); // i18n-exempt -- API-4100 developer log label [ttl=2026-12-31]
      return new Response(JSON.stringify({ error: t("api.common.unauthorized") }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = authHeader.slice("Bearer ".length);
    const secret = process.env.UPGRADE_PREVIEW_TOKEN_SECRET;
    if (!secret) {
      logger.warn("invalid token", { id: shopId, service: SERVICE_NAME, env: ENV_LABEL }); // i18n-exempt -- API-4100 developer log label [ttl=2026-12-31]
      return new Response(JSON.stringify({ error: t("api.common.forbidden") }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    try {
      jwt.verify(token, secret);
    } catch {
      logger.warn("invalid token", { id: shopId, service: SERVICE_NAME, env: ENV_LABEL }); // i18n-exempt -- API-4100 developer log label [ttl=2026-12-31]
      return new Response(JSON.stringify({ error: t("api.common.forbidden") }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const root = path.resolve(__dirname, "../../../../../..");
    const appDir = path.join(root, "apps", `shop-${shopId}`);
    const shopFile = path.join(root, "data", "shops", shopId, "shop.json");
    const pkgFile = path.join(appDir, "package.json");

    const body = (await request.json().catch(() => ({}))) as {
      components?: unknown;
    };
    const selected: string[] = Array.isArray(body.components)
      ? (body.components as string[])
      : [];

    const deps = readJsonFile<{ dependencies?: Record<string, string> }>(pkgFile).dependencies ?? {};
    const shop = readJsonFile<{
      componentVersions?: Record<string, string>;
      lastUpgrade?: string;
      [key: string]: unknown;
    }>(shopFile);
    shop.componentVersions = shop.componentVersions || {};

    const toLock = selected.length > 0 ? selected : Object.keys(deps);
    for (const name of toLock) {
      if (deps[name]) {
        shop.componentVersions[name] = deps[name];
      }
    }
    shop.lastUpgrade = new Date().toISOString();
    writeJsonFile(shopFile, shop);

    if (Object.keys(deps).length === 0) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    await run("pnpm", ["--filter", `apps/shop-${shopId}`, "build"], root);
    await run("pnpm", ["--filter", `apps/shop-${shopId}`, "deploy"], root);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    if (shopId) {
      incrementOperationalError(shopId);
    }
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
