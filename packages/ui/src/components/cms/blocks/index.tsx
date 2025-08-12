import type { ComponentType } from "react";

import { atomRegistry } from "./atoms";
import { moleculeRegistry } from "./molecules";
import { containerRegistry } from "./containers";
import { layoutRegistry } from "./layout";

export * from "./atoms";
export * from "./molecules";
export * from "./layout";

type BlockModule = { default: ComponentType<any> };

const modules = import.meta.glob<BlockModule>("./**/*.tsx", { eager: true });

const EXCLUDE = new Set([
  "index.tsx",
  "atoms.tsx",
  "molecules.tsx",
  "organisms.tsx",
  "layout.tsx",
  "containers.tsx",
  "Section.tsx",
  "Button.tsx",
  "Divider.tsx",
  "Spacer.tsx",
  "CustomHtml.tsx",
  "HeaderBlock.tsx",
  "FooterBlock.tsx",
]);

function toName(path: string) {
  const file = path.split("/").pop()!.replace(/\.tsx$/, "");
  const base = file.replace(/\.client$/, "");
  return base === "AnnouncementBarBlock" ? "AnnouncementBar" : base;
}

const organismRegistry = Object.fromEntries(
  Object.entries(modules)
    .filter(([path]) => {
      const file = path.split("/").pop()!;
      if (EXCLUDE.has(file)) return false;
      if (file.endsWith(".stories.tsx")) return false;
      if (path.includes("/__tests__/")) return false;
      if (path.includes("/containers/")) return false;
      return true;
    })
    .map(([path, mod]) => [toName(path), mod.default])
) as const;

export { atomRegistry, moleculeRegistry, containerRegistry, layoutRegistry, organismRegistry };

export const blockRegistry = {
  ...layoutRegistry,
  ...containerRegistry,
  ...atomRegistry,
  ...moleculeRegistry,
  ...organismRegistry,
} as const;

export type BlockType = keyof typeof blockRegistry;

