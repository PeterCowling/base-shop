"use client";

import { Inline, Stack } from "@acme/design-system/primitives";

import type { ComponentType } from "../defaults";
import type { PaletteMeta } from "../palette.types";
import { defaultIcon } from "../paletteData";
import PaletteItem from "../PaletteItem";
import { isTopLevelAllowed } from "../rules";

interface Props {
  recents: string[];
  paletteIndex: Map<string, PaletteMeta>;
  onAdd: (type: ComponentType, label: string) => void;
}

export default function RecentsList({ recents, paletteIndex, onAdd }: Props) {
  if (recents.length === 0) return null;
  return (
    <div className="space-y-2">
      <Inline className="justify-between" gap={2}>
        {/* i18n-exempt: Editor label, non-user content */}
        <h4 className="font-semibold capitalize">Recent</h4>
      </Inline>
      <Stack gap={2}>
        {recents
          .map((type) => {
            const match = paletteIndex.get(type);
            if (match) return match;
            const label = type.replace(/([A-Z])/g, " $1").trim();
            return { type: type as ComponentType, label, icon: defaultIcon, description: "", previewImage: defaultIcon } satisfies PaletteMeta;
          })
          .filter((p) => isTopLevelAllowed(p.type as ComponentType))
          .map((p) => (
            <PaletteItem
              key={`recent-${p.type}`}
              type={p.type as ComponentType}
              label={p.label}
              icon={p.icon}
              description={p.description}
              previewImage={p.previewImage}
              onAdd={onAdd}
            />
          ))}
      </Stack>
    </div>
  );
}
