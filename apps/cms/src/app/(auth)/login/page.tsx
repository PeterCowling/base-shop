// apps/cms/src/app/(auth)/login/page.tsx

import fs from "node:fs/promises";
import path from "node:path";
import LoginForm from "./LoginForm";

async function getDefaultShop(): Promise<string | null> {
  try {
    const shopsDir = path.resolve(process.cwd(), "data", "shops");
    const entries = await fs.readdir(shopsDir, { withFileTypes: true });
    const first = entries.find((e) => e.isDirectory())?.name;
    return first ?? null;
  } catch {
    return null;
  }
}

export default async function LoginPage() {
  const shop = await getDefaultShop();
  const fallbackUrl = shop ? `/shop/${shop}/products` : "/";
  return <LoginForm fallbackUrl={fallbackUrl} />;
}
