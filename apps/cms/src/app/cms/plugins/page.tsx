// apps/cms/src/app/cms/plugins/page.tsx
import { loadPlugins } from "@acme/platform-core";
import PluginList from "./PluginList.client";

export default async function PluginsPage() {
  const plugins = await loadPlugins();
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Plugins</h2>
      <PluginList plugins={plugins} />
    </div>
  );
}
