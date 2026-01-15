import { execSync, spawnSync } from "node:child_process";

function resolveFromEnv() {
  const candidates = [
    "CF_PAGES_COMMIT_SHA",
    "GITHUB_SHA",
    "VERCEL_GIT_COMMIT_SHA",
    "COMMIT_SHA",
    "SOURCE_VERSION",
    "CI_COMMIT_SHA",
    "CI_COMMIT_ID",
  ];
  for (const key of candidates) {
    const value = (process.env[key] ?? "").trim();
    if (!value) continue;
    if (/^[0-9a-f]{40}$/i.test(value)) return value.slice(0, 12);
    return value;
  }
  return "";
}

function resolveFromGit() {
  try {
    return execSync("git rev-parse --short=12 HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const existing = (process.env.NEXT_PUBLIC_XA_SW_VERSION ?? "").trim();
const resolved =
  existing || resolveFromEnv() || resolveFromGit() || Date.now().toString(36);

const env = {
  ...process.env,
  NEXT_PUBLIC_XA_SW_VERSION: resolved,
};

const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const result = spawnSync(pnpmCmd, ["exec", "next", "build"], {
  stdio: "inherit",
  env,
});

process.exit(result.status ?? 1);
