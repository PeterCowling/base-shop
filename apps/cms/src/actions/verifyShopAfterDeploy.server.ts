// apps/cms/src/actions/verifyShopAfterDeploy.server.ts
"use server";

import { spawn } from "node:child_process";

import type { Environment } from "@acme/types";

import { ensureAuthorized } from "./common/auth";

export interface VerificationResult {
  status: "not-run" | "passed" | "failed";
  error?: string;
}

export async function verifyShopAfterDeploy(
  shopId: string,
  env: Environment,
): Promise<VerificationResult> {
  await ensureAuthorized();

  // Allow environments to opt out of running the smoke suite; in that
  // case we record a neutral "not-run" status instead of failing deploys.
  if (process.env.SHOP_SMOKE_ENABLED !== "1") {
    return { status: "not-run" };
  }

  return new Promise<VerificationResult>((resolve) => {
    const timeoutMs = Number(process.env.SHOP_SMOKE_TIMEOUT_MS ?? 5 * 60 * 1000);
    let settled = false;

    const child = spawn("pnpm", ["test:shop-smoke"], {
      env: {
        ...process.env,
        SHOP_ID: shopId,
        SHOP_ENV: env,
        CI: "true",
      },
      stdio: "ignore",
    });

    try {
      console.info("[launch] smoke:start", { shopId, env, timeoutMs });
    } catch {
      /* ignore */
    }

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        child.kill("SIGTERM");
      } catch {
        /* ignore */
      }
      resolve({
        status: "failed",
        error: `test:shop-smoke timed out after ${timeoutMs}ms`,
      });
    }, timeoutMs);

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        status: "failed",
        error: (err as Error).message,
      });
    });

    child.on("exit", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code === 0) {
        try {
          console.info("[launch] smoke:success", { shopId, env });
        } catch {
          /* ignore */
        }
        resolve({ status: "passed" });
      } else {
        try {
          console.warn("[launch] smoke:fail", { shopId, env, code });
        } catch {
          /* ignore */
        }
        resolve({
          status: "failed",
          error: `test:shop-smoke exited with code ${code ?? "unknown"}`,
        });
      }
    });
  });
}
