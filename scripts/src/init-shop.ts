import { createShop } from "../../packages/platform-core/src/createShop";
import { validateShopName } from "../../packages/platform-core/src/shops";
import { envSchema } from "@config/src/env";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

function ensureRuntime() {
  const nodeMajor = parseInt(process.version.slice(1).split(".")[0], 10);
  if (nodeMajor < 20) {
    console.error(
      `Node.js 20 or higher is required; you are using ${process.version}.`
    );
    process.exit(1);
  }

  const pnpm = spawnSync("pnpm", ["--version"], { encoding: "utf8" });
  if (pnpm.status !== 0) {
    console.error("Unable to determine pnpm version. Is pnpm installed?");
    process.exit(1);
  }
  const pnpmVersion = pnpm.stdout.trim();
  const pnpmMajor = parseInt(pnpmVersion.split(".")[0], 10);
  if (pnpmMajor < 10) {
    console.error(
      `pnpm 10 or higher is required; you are using ${pnpmVersion}.`
    );
    process.exit(1);
  }
}

ensureRuntime();

async function prompt(question: string, def = ""): Promise<string> {
  const rl = readline.createInterface({ input, output });
  const answer = (await rl.question(question)).trim();
  rl.close();
  return answer || def;
}

async function main() {
  const rawId = await prompt("Shop ID: ");
  let shopId: string;
  try {
    shopId = validateShopName(rawId);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
  const name = await prompt("Display name (optional): ");
  const theme = await prompt("Theme [base]: ", "base");
  const template = await prompt("Template [template-app]: ", "template-app");
  const paymentAns = await prompt("Payment providers (comma-separated): ");
  const shippingAns = await prompt("Shipping providers (comma-separated): ");
  const ciAns = await prompt("Setup CI workflow? (y/N): ");

  const options = {
    ...(name && { name }),
    theme,
    template,
    payment: paymentAns.split(",").map((s) => s.trim()).filter(Boolean),
    shipping: shippingAns.split(",").map((s) => s.trim()).filter(Boolean),
  };

  const prefixedId = `shop-${shopId}`;
  createShop(prefixedId, options);

  let validationError: unknown;
  try {
    const envPath = join("apps", prefixedId, ".env");
    if (!existsSync(envPath)) throw new Error(`Missing ${envPath}`);
    const envRaw = readFileSync(envPath, "utf8");
    const env: Record<string, string> = {};
    for (const line of envRaw.split(/\n+/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...rest] = trimmed.split("=");
      env[key] = rest.join("=");
    }
    envSchema.parse(env);
  } catch (err) {
    validationError = err;
  }

  if (ciAns.toLowerCase().startsWith("y")) {
    spawnSync("pnpm", ["ts-node", "scripts/src/setup-ci.ts", shopId], {
      stdio: "inherit",
    });
  }

  if (validationError) {
    console.error("\nEnvironment validation failed:\n", validationError);
  } else {
    console.log("\nEnvironment variables look valid.");
  }

  console.log(
    `\nNext steps:\n  - Review apps/${prefixedId}/.env\n  - Run: pnpm --filter @apps/${prefixedId} dev`
  );
}

main();
