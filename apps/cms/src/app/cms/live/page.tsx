// apps/cms/src/app/cms/live/page.tsx

import { Button } from "@/components/atoms-shadcn";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { listShops } from "../listShops";

export const metadata = {
  title: "Live shops · Base-Shop",
};

function resolveAppsRoot(): string {
  let dir = process.cwd();
  while (true) {
    const candidate = path.join(dir, "apps");
    if (fsSync.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "apps");
}

async function findPort(shop: string): Promise<number | null> {
  try {
    const root = resolveAppsRoot();
    const pkgPath = path.join(root, `shop-${shop}`, "package.json");
    const pkgRaw = await fs.readFile(pkgPath, "utf8");
    const pkg = JSON.parse(pkgRaw) as { scripts?: Record<string, string> };
    const cmd = pkg.scripts?.dev ?? pkg.scripts?.start ?? "";
    const match = cmd.match(/-p\s*(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  } catch {
    return null;
  }
}

export default async function LivePage() {
  const shops = await listShops();
  const ports: Record<string, number | null> = {};
  await Promise.all(
    shops.map(async (shop) => {
      ports[shop] = await findPort(shop);
    })
  );

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Live shops</h2>
      <ul className="space-y-2">
        {shops.map((shop) => {
          const port = ports[shop];
          const url = port ? `http://localhost:${port}` : "#";
          return (
            <li key={shop}>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <Button>{shop}</Button>
              </a>
            </li>
          );
        })}
        {shops.length === 0 && <li>No shops found.</li>}
      </ul>
    </div>
  );
}
