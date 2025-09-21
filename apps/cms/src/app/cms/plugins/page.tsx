// apps/cms/src/app/cms/plugins/page.tsx
import { loadPlugins } from "@platform-core/plugins";
import Link from "next/link";
import PluginList from "./PluginList.client";

export default async function PluginsPage() {
  // Let the platform-core plugin loader discover the workspace plugins directory
  const plugins = await loadPlugins();
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Plugins</h2>
      <PluginList plugins={plugins} />
      <div className="mt-6">
        <Link
          href="/cms/blog/sanity/connect"
          className="text-primary hover:underline"
        >
          Connect blog (Sanity)
        </Link>
      </div>
    </div>
  );
}
