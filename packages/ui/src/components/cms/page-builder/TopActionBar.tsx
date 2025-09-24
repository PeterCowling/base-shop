"use client";

import React from "react";
import { Button } from "../../atoms/shadcn";
import { Tooltip } from "../../atoms";
import { Spinner } from "../../atoms";

interface Props {
  onSave: () => void;
  onPublish: () => void;
  saving?: boolean;
  publishing?: boolean;
  showPreview?: boolean;
  togglePreview?: () => void;
  showVersions?: boolean;
  showPreviewButton?: boolean;
  publishLabel?: string;
}

// Compact top-row actions aligned to the right: Save, Publish, Versions, Save Version
export default function TopActionBar({ onSave, onPublish, saving = false, publishing = false, showPreview, togglePreview, showVersions = true, showPreviewButton = true, publishLabel = "Publish" }: Props) {
  return (
    <div className="flex w-full items-center justify-end gap-2">
      <Tooltip text="Save (Ctrl/⌘+S)">
        <Button onClick={onSave} disabled={saving}>
          {saving ? <Spinner className="h-4 w-4" /> : "Save"}
        </Button>
      </Tooltip>
      <Tooltip text={publishLabel}>
        <Button
          variant="default"
          className="h-9 px-4"
          onClick={onPublish}
          disabled={publishing}
          data-tour="publish"
        >
          {publishing ? <Spinner className="h-4 w-4" /> : publishLabel}
        </Button>
      </Tooltip>
      {showPreviewButton && typeof showPreview === 'boolean' && togglePreview && (
        <Tooltip text="Toggle preview (Ctrl/⌘+Alt+P)">
          <Button
            variant="outline"
            className="h-9 px-3 text-sm"
            onClick={() => {
              const next = !showPreview;
              try { window.dispatchEvent(new CustomEvent('pb:notify', { detail: { type: 'preview', title: next ? 'Preview enabled' : 'Preview disabled' } })); } catch {}
              togglePreview();
            }}
            aria-label={showPreview ? "Hide preview" : "Show preview"}
            title={showPreview ? "Hide preview" : "Show preview"}
          >
            {showPreview ? "Editing" : "Preview"}
          </Button>
        </Tooltip>
      )}
      {showVersions && (
        <>
          <Tooltip text="Manage versions (Ctrl/⌘+Shift+V)">
            <Button
              variant="outline"
              onClick={() => {
                try { window.dispatchEvent(new Event("pb:open-versions")); } catch {}
              }}
            >
              Versions
            </Button>
          </Tooltip>
          <Tooltip text="Save version snapshot (Ctrl/⌘+Shift+S)">
            <Button
              variant="outline"
              onClick={() => {
                try { window.dispatchEvent(new Event("pb:save-version")); } catch {}
              }}
            >
              Save Version
            </Button>
          </Tooltip>
        </>
      )}
    </div>
  );
}
