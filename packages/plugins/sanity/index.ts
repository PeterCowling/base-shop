// packages/plugins/sanity/index.ts
import type { Plugin, WidgetRegistry } from "../../platform-core/src";

const sanityPlugin: Plugin = {
  id: "sanity",
  name: "Sanity Blog",
  description: "Connects shops to a Sanity-powered blog",
  defaultConfig: {
    projectId: "",
    dataset: "",
    token: "",
  },
  registerWidgets(registry: WidgetRegistry) {
    registry.add("sanity-blog", {});
  },
};

export default sanityPlugin;
