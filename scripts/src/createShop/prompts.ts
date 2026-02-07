import readline from "node:readline";

import { readdirSync } from "fs";
import { join } from "path";

import { listThemes } from "@acme/platform-core/createShop";
import type { ProviderInfo } from "@acme/platform-core/createShop/listProviders";
import { listProviders } from "@acme/platform-core/createShop/listProviders";

import type { Options } from "./parse";

/**
 * Prompt for any options not provided on the command line.
 */
export async function gatherOptions(
  shopId: string,
  options: Options,
  themeProvided: boolean,
  templateProvided: boolean
): Promise<void> {
  const prefilled =
    themeProvided &&
    templateProvided &&
    options.name !== undefined &&
    options.logo !== undefined &&
    options.contactInfo !== undefined &&
    (options.payment as string[]).length > 0 &&
    (options.shipping as string[]).length > 0 &&
    options.enableSubscriptions !== undefined;

  if (prefilled) {
    return;
  }
  /** Prompt for theme when none is provided on the command line. */
  async function ensureTheme() {
    if (!themeProvided && process.stdin.isTTY) {
      const themes = listThemes();
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      await new Promise<void>((resolve) => {
        rl.question(`Select theme [${themes.join(", ")}]: `, (ans) => {
          if (themes.includes(ans)) options.theme = ans;
          rl.close();
          resolve();
        });
      });
    }
  }

  /** Prompt for template when none is provided on the command line. */
  async function ensureTemplate() {
    if (!templateProvided && process.stdin.isTTY) {
      const packagesDir = join("packages");
      const templates = readdirSync(packagesDir, { withFileTypes: true })
        .filter((d) => d.isDirectory() && d.name.startsWith("template-"))
        .map((d) => d.name);
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      await new Promise<void>((resolve) => {
        rl.question(`Select template [${templates.join(", ")}]: `, (ans) => {
          if (templates.includes(ans)) options.template = ans;
          rl.close();
          resolve();
        });
      });
    }
  }

  /** Prompt for shop name when none is provided on the command line. */
  async function ensureName() {
    if (!options.name && process.stdin.isTTY) {
      const defaultName = shopId
        .split(/[-_]/)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      await new Promise<void>((resolve) => {
        rl.question(`Shop name [${defaultName}]: `, (ans) => {
          options.name = ans || defaultName;
          rl.close();
          resolve();
        });
      });
    }
  }

  /** Prompt for logo URL when none is provided on the command line. */
  async function ensureLogo() {
    if (options.logo === undefined && process.stdin.isTTY) {
      const defaultLogo = `https://example.com/${shopId}.png`;
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      await new Promise<void>((resolve) => {
        rl.question(`Logo URL [${defaultLogo}]: `, (ans) => {
          options.logo = ans || "";
          rl.close();
          resolve();
        });
      });
    }
  }

  /** Prompt for contact info when none is provided on the command line. */
  async function ensureContact() {
    if (options.contactInfo === undefined && process.stdin.isTTY) {
      const defaultContact = `support@${shopId}.com`;
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      await new Promise<void>((resolve) => {
        rl.question(`Contact info [${defaultContact}]: `, (ans) => {
          options.contactInfo = ans || "";
          rl.close();
          resolve();
        });
      });
    }
  }

  /** Prompt for payment providers when none are provided on the command line. */
  async function ensurePayment() {
    if ((options.payment as string[]).length === 0 && process.stdin.isTTY) {
      const providers: ProviderInfo[] = await listProviders("payment");
      const ids = providers.map((p) => p.id);
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      await new Promise<void>((resolve) => {
        rl.question(
          `Select payment providers (comma-separated) [${ids.join(", ")}]: `,
          (ans) => {
            options.payment = ans
              .split(",")
              .map((s) => s.trim())
              .filter((p) => ids.includes(p)) as Options["payment"];
            rl.close();
            resolve();
          }
        );
      });
    }
  }

  /** Prompt for shipping providers when none are provided on the command line. */
  async function ensureShipping() {
    if ((options.shipping as string[]).length === 0 && process.stdin.isTTY) {
      const providers: ProviderInfo[] = await listProviders("shipping");
      const ids = providers.map((p) => p.id);
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      await new Promise<void>((resolve) => {
        rl.question(
          `Select shipping providers (comma-separated) [${ids.join(", ")}]: `,
          (ans) => {
            options.shipping = ans
              .split(",")
              .map((s) => s.trim())
              .filter((p) => ids.includes(p)) as Options["shipping"];
            rl.close();
            resolve();
          }
        );
      });
    }
  }

  /** Prompt for subscription module toggle when not provided. */
  async function ensureSubscriptions() {
    if (options.enableSubscriptions === undefined && process.stdin.isTTY) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      await new Promise<void>((resolve) => {
        rl.question("Enable subscriptions? [y/N]: ", (ans) => {
          options.enableSubscriptions = ans.toLowerCase() === "y";
          rl.close();
          resolve();
        });
      });
    }
  }

  await ensureTemplate();
  await ensureTheme();
  await ensureName();
  await ensureLogo();
  await ensureContact();
  await ensurePayment();
  await ensureShipping();
  await ensureSubscriptions();
}
