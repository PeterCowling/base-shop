// apps/cms/src/app/cms/live/page.tsx

import { Button } from "@/components/atoms/shadcn";
import fsSync from "fs";
import fs from "fs/promises";
import path from "path";
import { listShops } from "../listShops";

export const metadata = {
  title: "Live shops · Base-Shop",
};

function resolveAppsRoot(): string {
  let dir = process.cwd();
  while (true) {
    const appsPath = path.join(dir, "apps");
    if (fsSync.existsSync(appsPath)) return appsPath;

    const parent = path.dirname(dir);
    if (parent === dir) break; // reached filesystem root
    dir = parent;
  }
  return path.resolve(process.cwd(), "apps");
}

export type PortInfo = {
  port: number | null;
  error?: string;
};

async function findPort(shop: string): Promise<PortInfo> {
  try {
    const root = resolveAppsRoot();
    const pkgPath = path.join(root, `shop-${shop}`, "package.json");
    const pkgRaw = await fs.readFile(pkgPath, "utf8");
    const pkg = JSON.parse(pkgRaw) as { scripts?: Record<string, string> };

    const cmd = pkg.scripts?.dev ?? pkg.scripts?.start ?? "";
    const match = cmd.match(/-p\s*(\d+)/);

    return { port: match ? parseInt(match[1], 10) : null };
  } catch (error) {
    console.error(`Failed to determine port for shop ${shop}:`, error);
    return {
      port: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export default async function LivePage() {
  const shops = await listShops();

  // Gather port info for all shops in parallel
  const portInfo: Record<string, PortInfo> = Object.fromEntries(
    await Promise.all(
      shops.map(async (shop) => {
        const info = await findPort(shop);
        return [shop, info] as const;
      })
    )
  );

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Live shops</h2>
      <ul className="space-y-2">
        {shops.map((shop) => {
          const info = portInfo[shop];
          const url = info?.port ? `http://localhost:${info.port}` : "#";

          return (
            <li key={shop}>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <Button>{shop}</Button>
              </a>
              {info?.error && (
                <p className="text-sm text-red-600">
                  Failed to determine port: {info.error}
                </p>
              )}
            </li>
          );
        })}

        {shops.length === 0 && <li>No shops found.</li>}
      </ul>
    </div>
  );
}
