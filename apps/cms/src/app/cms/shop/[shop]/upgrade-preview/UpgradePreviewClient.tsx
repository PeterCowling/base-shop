// apps/cms/src/app/cms/shop/[shop]/upgrade-preview/UpgradePreviewClient.tsx
"use client";

import { useEffect, useState } from "react";
import type { UpgradeComponent } from "@acme/types/upgrade";
import ComponentPreview from "@ui/components/ComponentPreview";
import { z } from "zod";

export default function UpgradePreviewClient({ shop }: { shop: string }) {
  const [changes, setChanges] = useState<UpgradeComponent[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/${shop}/api/upgrade-changes`);
        const schema = z.object({
          components: z
            .array(
              z.object({
                file: z.string(),
                componentName: z.string(),
                oldChecksum: z.string().optional(),
                newChecksum: z.string().optional(),
              }),
            )
            .catch([]),
        });
        const data = schema.parse(await res.json());
        setChanges(data.components as UpgradeComponent[]);
      } catch (err) {
        console.error("Failed to load upgrade changes", err);
      }
    }
    void load();
  }, [shop]);

  return (
    <div className="space-y-8">
      <ul className="space-y-4">
        {changes.map((c) => (
          <li key={c.file}>
            <ComponentPreview component={c} />
          </li>
        ))}
        {changes.length === 0 && <li>No changes to preview.</li>}
      </ul>
    </div>
  );
}

