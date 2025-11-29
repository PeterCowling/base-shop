// apps/cms/src/app/cms/plugins/page.tsx
import { loadPlugins } from "@platform-core/plugins";
import Link from "next/link";
import PluginList from "./PluginList.client";

// This page performs runtime filesystem discovery; avoid prerender during build.
export const dynamic = "force-dynamic";

export default async function PluginsPage() {
  // Let the platform-core plugin loader discover the workspace plugins directory
  const plugins = await loadPlugins();
  const serializablePlugins = plugins.map((plugin) => ({
    id: plugin.id,
    name: plugin.name,
    description: plugin.description,
    defaultConfig: plugin.defaultConfig ?? {},
  }));
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Plugins</h2>
      <PluginList plugins={serializablePlugins} />
      <div className="mt-6">
        <Link
          href="/cms/blog/sanity/connect"
          className="text-link hover:underline"
        >
          Connect blog (Sanity)
        </Link>
      </div>
    </div>
  );
}
