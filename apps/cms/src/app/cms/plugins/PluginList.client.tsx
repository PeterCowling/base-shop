// apps/cms/src/app/cms/plugins/PluginList.client.tsx
"use client";

import { useState } from "react";
import type { Plugin } from "@platform-core/plugins";

interface Props {
  plugins: Plugin[];
}

export default function PluginList({ plugins }: Props) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [configs, setConfigs] = useState<Record<string, string>>(
    Object.fromEntries(
      plugins.map((p) => [p.id, JSON.stringify(p.defaultConfig ?? {}, null, 2)])
    )
  );

  return (
    <ul className="space-y-6">
      {plugins.map((plugin) => (
        <li key={plugin.id} className="border-b border-border/10 pb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={enabled[plugin.id] ?? false}
              onChange={(e) =>
                setEnabled({ ...enabled, [plugin.id]: e.target.checked })
              }
            />
            <span className="font-medium">{plugin.name}</span>
          </label>
          {enabled[plugin.id] && (
            <textarea
              className="mt-2 w-full rounded-md border border-input bg-background p-2 font-mono text-sm"
              rows={4}
              value={configs[plugin.id]}
              onChange={(e) =>
                setConfigs({ ...configs, [plugin.id]: e.target.value })
              }
            />
          )}
        </li>
      ))}
      {plugins.length === 0 && <li>No plugins installed.</li>}
    </ul>
  );
}
