import { createShop } from "../../packages/platform-core/src/createShop";
import { validateShopName } from "../../packages/platform-core/src/shops";
import { spawnSync, execSync } from "node:child_process";
import { validateShopEnv } from "../../packages/platform-core/src/configurator";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { defaultPaymentProviders } from "../../packages/platform-core/src/createShop/defaultPaymentProviders";
import { defaultShippingProviders } from "../../packages/platform-core/src/createShop/defaultShippingProviders";

function ensureRuntime() {
  const nodeMajor = Number(process.version.replace(/^v/, "").split(".")[0]);
  if (nodeMajor < 20) {
    console.error(
      `Node.js v20 or later is required. Current version: ${process.version}`
    );
    process.exit(1);
  }

  let pnpmVersion: string;
  try {
    pnpmVersion = execSync("pnpm --version", { encoding: "utf8" }).trim();
  } catch {
    console.error(
      "Failed to determine pnpm version. pnpm v10 or later is required."
    );
    process.exit(1);
  }

  const pnpmMajor = Number(pnpmVersion.split(".")[0]);
  if (pnpmMajor < 10) {
    console.error(
      `pnpm v10 or later is required. Current version: ${pnpmVersion}`
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

async function selectProviders(
  label: string,
  providers: readonly string[]
): Promise<string[]> {
  console.log(`Available ${label}:`);
  providers.forEach((p, i) => console.log(`  ${i + 1}) ${p}`));
  const ans = await prompt(
    `Select ${label} by number (comma-separated, empty for none): `
  );
  const selections = ans
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const result = new Set<string>();
  for (const sel of selections) {
    const idx = Number(sel) - 1;
    if (!Number.isNaN(idx) && providers[idx]) {
      result.add(providers[idx]);
    }
  }
  return Array.from(result);
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
  const logo = await prompt("Logo URL (optional): ");
  const contact = await prompt("Contact email (optional): ");
  const typeAns = await prompt("Shop type (sale or rental) [sale]: ", "sale");
  const type = typeAns.toLowerCase() === "rental" ? "rental" : "sale";
  const theme = await prompt("Theme [base]: ", "base");
  const template = await prompt("Template [template-app]: ", "template-app");
  const payment = await selectProviders(
    "payment providers",
    defaultPaymentProviders
  );
  const shipping = await selectProviders(
    "shipping providers",
    defaultShippingProviders
  );
  const ciAns = await prompt("Setup CI workflow? (y/N): ");

  const options = {
    ...(name && { name }),
    ...(logo && { logo }),
    ...(contact && { contactInfo: contact }),
    type,
    theme,
    template,
    payment,
    shipping,
  };

  const prefixedId = `shop-${shopId}`;
  createShop(prefixedId, options, { deploy: true });

  let validationError: unknown;
  try {
    validateShopEnv(prefixedId);
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
    `\nNext steps:\n  - Review apps/${prefixedId}/.env\n  - Review data/shops/${prefixedId}/shop.json\n  - Run: pnpm --filter @apps/${prefixedId} dev`
  );
}

main();
