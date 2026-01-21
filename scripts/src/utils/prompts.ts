import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import type { CreateShopOptions } from "@acme/platform-core/createShop";

export async function prompt(question: string, def = ""): Promise<string> {
  const rl = readline.createInterface({ input, output });
  const answer = (await rl.question(question)).trim();
  rl.close();
  // Ensure stdin/stdout don't keep the event loop alive in tests
  // or after the prompt completes.
  typeof (input as any).unref === "function" && (input as any).unref();
  typeof (output as any).unref === "function" && (output as any).unref();
  return answer || def;
}

export async function selectProviders<T extends string>(
  label: string,
  providers: readonly T[],
): Promise<T[]> {
  console.log(`Available ${label}:`);
  providers.forEach((p, i) => console.log(`  ${i + 1}) ${p}`));
  const ans = await prompt(
    `Select ${label} by number (comma-separated, empty for none): `,
  );
  const selections = ans
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const result = new Set<T>();
  for (const sel of selections) {
    const idx = Number(sel) - 1;
    if (!Number.isNaN(idx) && providers[idx]) {
      result.add(providers[idx]);
    }
  }
  return Array.from(result);
}

export async function selectOption(
  label: string,
  options: readonly string[],
  defIndex = 0,
): Promise<string> {
  console.log(`Available ${label}:`);
  options.forEach((p, i) => console.log(`  ${i + 1}) ${p}`));
  while (true) {
    const ans = await prompt(
      `Select ${label} by number [${defIndex + 1}]: `,
      String(defIndex + 1),
    );
    const idx = Number(ans) - 1;
    if (!Number.isNaN(idx) && options[idx]) {
      return options[idx];
    }
    console.error(`Invalid ${label} selection.`);
  }
}

export async function promptUrl(question: string): Promise<string | undefined> {
  while (true) {
    const ans = await prompt(question);
    if (!ans) return undefined;
    try {
      new URL(ans);
      return ans;
    } catch {
      console.error("Invalid URL.");
    }
  }
}

export async function promptEmail(
  question: string,
): Promise<string | undefined> {
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  while (true) {
    const ans = await prompt(question);
    if (!ans) return undefined;
    if (emailRe.test(ans)) {
      return ans;
    }
    console.error("Invalid email address.");
  }
}

export async function promptNavItems(): Promise<
  CreateShopOptions["navItems"]
> {
  const items: CreateShopOptions["navItems"] = [];
  while (true) {
    const label = await prompt("Nav label (leave empty to finish): ");
    if (!label) break;
    const url = await prompt("Nav URL: ");
    items.push({ label, url });
  }
  return items;
}

export async function promptPages(): Promise<CreateShopOptions["pages"]> {
  const pages: CreateShopOptions["pages"] = [];
  while (true) {
    const slug = await prompt("Page slug (leave empty to finish): ");
    if (!slug) break;
    const title = await prompt("Page title: ");
    pages.push({ slug, title: { en: title }, components: [], status: "draft", visibility: "public" });
  }
  return pages;
}

