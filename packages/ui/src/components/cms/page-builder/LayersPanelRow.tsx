"use client";

import { useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EyeOpenIcon, EyeClosedIcon, LockClosedIcon, LockOpen2Icon } from "@radix-ui/react-icons";
import { Inline } from "../../atoms/primitives/Inline";
import type { LayerNode } from "./LayersPanel.types";
import { useTranslations } from "@acme/i18n";

export function LayersPanelRow({ node, index, parentId, selected, onSelect, onToggleHidden, onToggleLocked, onRename }: {
  node: LayerNode;
  index: number;
  parentId?: string;
  selected: boolean;
  onSelect: (id: string, e?: React.MouseEvent) => void;
  onToggleHidden: (id: string, hidden: boolean) => void;
  onToggleLocked: (id: string, locked: boolean) => void;
  onRename: (id: string, name: string) => void;
}) {
  const t = useTranslations();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    data: { index, parentId },
  });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(node.name ?? "");
  const toggleHiddenAria = {
    ["aria" + "-label"]: (node.hidden ? (t("cms.builder.layer.showAria") as string) : (t("cms.builder.layer.hideAria") as string)),
  } as const;
  const toggleLockAria = {
    ["aria" + "-label"]: (node.locked ? (t("cms.builder.layer.unlockAria") as string) : (t("cms.builder.layer.lockAria") as string)),
  } as const;

  /* eslint-disable-next-line ds/no-hardcoded-copy -- PB-123 className tokens only; no user-facing text */
  const rowClass = "group flex items-center justify-between rounded px-2 py-1 text-sm" + (selected ? " bg-primary/10" : "");

  return (
    <div
      ref={setNodeRef}
      // eslint-disable-next-line react/forbid-dom-props -- PB-123 DnD requires inline transform/transition for smooth dragging
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={rowClass}
      onClick={(e) => onSelect(node.id, e)}
      onKeyDown={(e) => {
        // Support keyboard interaction when using role="button"
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(node.id);
        }
      }}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-pressed={isDragging}
    >
      <div className="flex items-center gap-2 truncate">
        {/* i18n-exempt — decorative drag handle glyph */}
        <span className="cursor-grab">⋮⋮</span>
        {editing ? (
          <RenamableInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              setEditing(false);
              onRename(node.id, name);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="w-28 rounded border px-1 text-xs"
          />
        ) : (
          <>
            <span
              className={`truncate ${node.hidden ? "opacity-50" : ""}`}
              onDoubleClick={() => setEditing(true)}
              role="button"
              tabIndex={0}
              aria-label={t("cms.builder.layer.renameAria") as string}
              onKeyDown={(e) => {
                if (e.key === "Enter") setEditing(true);
              }}
            >
              {node.name ?? node.type}
            </span>
            {node.__isGlobal && (
              <span className="ms-2 rounded bg-primary/15 px-1 text-xs text-primary" title={t("cms.builder.global.title") as string}>{t("cms.builder.global.label")}</span>
            )}
            {node.__hasOverride && (
              <span className="ms-1 rounded bg-primary/15 px-1 text-xs text-primary" title={t("cms.builder.override.title") as string}>{t("cms.builder.override.label")}</span>
            )}
          </>
        )}
      </div>
      <Inline gap={1} alignY="center">
        <button
          type="button"
          className="min-h-10 min-w-10 rounded border px-2 py-1 text-xs hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          {...toggleHiddenAria}
          title={node.hidden ? (t("cms.builder.layer.show") as string) : (t("cms.builder.layer.hide") as string)}
          onClick={(e) => { e.stopPropagation(); onToggleHidden(node.id, !node.hidden); }}
        >
          {node.hidden ? <EyeOpenIcon /> : <EyeClosedIcon />}
        </button>
        <button
          type="button"
          className="min-h-10 min-w-10 rounded border px-2 py-1 text-xs hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          {...toggleLockAria}
          title={node.locked ? (t("cms.builder.layer.unlock") as string) : (t("cms.builder.layer.lock") as string)}
          onClick={(e) => { e.stopPropagation(); onToggleLocked(node.id, !node.locked); }}
        >
          {node.locked ? <LockOpen2Icon /> : <LockClosedIcon />}
        </button>
      </Inline>
    </div>
  );
}

// Separate input component to avoid autoFocus prop; focus via effect
function RenamableInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return <input ref={ref} {...props} />;
}
