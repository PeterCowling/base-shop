import { envSchema } from "@config/env";
import { spawnSync } from "node:child_process";

try {
  envSchema.parse(process.env);
} catch (err) {
  console.error("Invalid environment variables:\n", err);
  process.exit(1);
}

const [, , cmd] = process.argv;

function run(bin: string, args: string[]) {
  const result = spawnSync(bin, args, { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

switch (cmd) {
  case "dev":
    run("vite", ["dev"]);
    break;
  case "build":
    run("vite", ["build"]);
    break;
  case "deploy":
    run("wrangler", ["pages", "deploy", ".vercel/output/static"]);
    break;
  default:
    console.log("Usage: pnpm configurator <dev|build|deploy>");
    process.exit(1);
}
