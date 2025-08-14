import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

function run(cmd: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, stdio: "inherit" });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} failed with status ${code}`));
    });
  });
}

export const onRequestPost = async ({ params, request }: {
  params: Record<string, string>;
  request: Request;
}) => {
  try {
    const id = params.id;
    const root = path.resolve(__dirname, "../../../../../..");
    const appDir = path.join(root, "apps", `shop-${id}`);
    const shopFile = path.join(root, "data", "shops", id, "shop.json");
    const pkgFile = path.join(appDir, "package.json");

    const body = await request.json().catch(() => ({}));
    const selected: string[] = Array.isArray(body.components) ? body.components : [];

    const deps = JSON.parse(readFileSync(pkgFile, "utf8")).dependencies ?? {};
    const shop = JSON.parse(readFileSync(shopFile, "utf8"));
    shop.componentVersions = shop.componentVersions || {};

    const toLock = selected.length > 0 ? selected : Object.keys(deps);
    for (const name of toLock) {
      if (deps[name]) {
        shop.componentVersions[name] = deps[name];
      }
    }
    shop.lastUpgrade = new Date().toISOString();
    writeFileSync(shopFile, JSON.stringify(shop, null, 2));

    await run("pnpm", ["--filter", `apps/shop-${id}", "build"], root);
    await run("pnpm", ["--filter", `apps/shop-${id}", "deploy"], root);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
