import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";

const XA_ROOT = path.resolve(__dirname, "../..");
const CONFIG_URL = pathToFileURL(path.resolve(XA_ROOT, "next.config.mjs")).href;

function importNextConfig(env: Record<string, string | undefined>) {
  const mergedEnv: Record<string, string> = { ...(process.env as Record<string, string>) };

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete mergedEnv[key];
    } else {
      mergedEnv[key] = value;
    }
  }

  const script = `const url=${JSON.stringify(CONFIG_URL)};import(url).then(()=>process.exit(0)).catch((err)=>{console.error(err?.message??String(err));process.exit(1);});`;

  return spawnSync(process.execPath, ["-e", script], {
    cwd: XA_ROOT,
    env: mergedEnv,
    encoding: "utf8",
  });
}

it("requires NEXTAUTH_SECRET in production", () => {
  const result = importNextConfig({
    NODE_ENV: "production",
    NEXT_PHASE: undefined,
    NEXTAUTH_SECRET: undefined,
    SESSION_SECRET: "s".repeat(32),
    CART_COOKIE_SECRET: "cart-secret",
  });

  expect(result.status).not.toBe(0);
  expect(result.stderr).toMatch(/NEXTAUTH_SECRET/);
});

it("requires SESSION_SECRET in production", () => {
  const result = importNextConfig({
    NODE_ENV: "production",
    NEXT_PHASE: undefined,
    NEXTAUTH_SECRET: "n".repeat(32),
    SESSION_SECRET: undefined,
    CART_COOKIE_SECRET: "cart-secret",
  });

  expect(result.status).not.toBe(0);
  expect(result.stderr).toMatch(/SESSION_SECRET/);
});

it("requires CART_COOKIE_SECRET in production", () => {
  const result = importNextConfig({
    NODE_ENV: "production",
    NEXT_PHASE: undefined,
    NEXTAUTH_SECRET: "n".repeat(32),
    SESSION_SECRET: "s".repeat(32),
    CART_COOKIE_SECRET: undefined,
  });

  expect(result.status).not.toBe(0);
  expect(result.stderr).toMatch(/CART_COOKIE_SECRET/);
});
