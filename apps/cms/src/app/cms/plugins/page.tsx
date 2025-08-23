// apps/cms/src/app/cms/plugins/page.tsx
import path from "path";
import { loadPlugins } from "@platform-core/plugins";
import Link from "next/link";
import PluginList from "./PluginList.client";

export default async function PluginsPage() {
  const pluginsDir = path.resolve(process.cwd(), "packages/plugins");
  const plugins = await loadPlugins({ directories: [pluginsDir] });
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Plugins</h2>
      <PluginList plugins={plugins} />
      <div className="mt-6">
        <Link
          href="/cms/blog/sanity/connect"
          className="text-blue-600 hover:underline"
        >
          Connect blog (Sanity)
        </Link>
      </div>
    </div>
  );
}
