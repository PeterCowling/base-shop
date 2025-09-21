import { useCallback, useMemo } from "react";
import type { PageComponent } from "@acme/types";
import { ulid } from "ulid";
import { saveLibrary } from "../libraryStore";
import { usePathname } from "next/navigation";
import { getShopFromPath } from "@acme/shared-utils";

interface Args {
  components: PageComponent[];
  selectedIds: string[];
}

function createPlaceholderThumbnail(text: string): string | null {
  try {
    const size = 48;
    const c = document.createElement("canvas");
    c.width = size; c.height = size;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    let h = 0; for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
    const r = 128 + (h & 0x7F), g = 128 + ((h >> 7) & 0x7F), b = 128 + ((h >> 14) & 0x7F);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, size, size);
    const fg = getComputedStyle(document.documentElement).getPropertyValue("--color-fg").trim();
    ctx.fillStyle = fg || "white";
    const ff = getComputedStyle(document.documentElement).getPropertyValue("--font-family").trim();
    ctx.font = `bold 20px ${ff || 'system-ui'}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText((text || "?").slice(0, 1).toUpperCase(), size / 2, size / 2);
    return c.toDataURL("image/png");
  } catch {
    return null;
  }
}

const useLibraryActions = ({ components, selectedIds }: Args) => {
  const pathname = usePathname() ?? "";
  const shop = useMemo(() => getShopFromPath(pathname), [pathname]);

  const saveSelectionToLibrary = useCallback(() => {
    if (!selectedIds.length) return;

    const selectedSet = new Set(selectedIds);
    const out: PageComponent[] = [];
    const visit = (nodes: PageComponent[], ancestorSelected: boolean) => {
      for (const n of nodes) {
        const isSel = selectedSet.has(n.id);
        if (isSel && !ancestorSelected) {
          out.push(n);
          visit((n as any).children || [], true);
        } else {
          visit((n as any).children || [], ancestorSelected || isSel);
        }
      }
    };
    visit(components, false);

    const defaultLabel = out.length === 1 ? ((out[0] as any).name || out[0].type) : `${out.length} blocks`;
    const label = window.prompt("Save to My Library as:", defaultLabel) || defaultLabel;
    const tagsRaw = window.prompt("Add tags (comma-separated)", "") || "";
    const tags = tagsRaw.split(/[\,\n]/).map((t) => t.trim()).filter(Boolean);
    const thumbnail = createPlaceholderThumbnail(label);

    const item = out.length === 1
      ? { id: ulid(), label, template: out[0], createdAt: Date.now(), tags, thumbnail }
      : { id: ulid(), label, templates: out, createdAt: Date.now(), tags, thumbnail };
    void saveLibrary(shop, item as any);
  }, [components, selectedIds, shop]);

  return { saveSelectionToLibrary };
};

export default useLibraryActions;
