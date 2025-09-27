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
      {/* i18n-exempt -- CMS builder control hint */}
      <Tooltip text="Save (Ctrl/⌘+S)">
        <Button onClick={onSave} disabled={saving}>
          {saving ? <Spinner className="h-4 w-4" /> : (
            // i18n-exempt -- CMS builder action label
            "Save"
          )}
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
        // i18n-exempt -- CMS builder control hint
        <Tooltip text="Toggle preview (Ctrl/⌘+Alt+P)">
          <Button
            variant="outline"
            className="h-9 px-3 text-sm"
            onClick={() => {
              const next = !showPreview;
              try {
                // i18n-exempt -- internal toast titles for builder-only notifications
                window.dispatchEvent(new CustomEvent('pb:notify', { detail: { type: 'preview', title: next ? 'Preview enabled' : 'Preview disabled' } }));
              } catch {}
              togglePreview();
            }}
            // i18n-exempt -- accessibility labels within internal CMS tool
            aria-label={showPreview ? "Hide preview" : "Show preview"}
            // i18n-exempt -- tooltip title within internal CMS tool
            title={showPreview ? "Hide preview" : "Show preview"}
          >
            {/* i18n-exempt -- CMS builder toggle label */}
            {showPreview ? "Editing" : "Preview"}
          </Button>
        </Tooltip>
      )}
      {showVersions && (
        <>
          {/* i18n-exempt -- CMS builder control hint */}
          <Tooltip text="Manage versions (Ctrl/⌘+Shift+V)">
            <Button
              variant="outline"
              onClick={() => {
                try { window.dispatchEvent(new Event("pb:open-versions")); } catch {}
              }}
            >
              {/* i18n-exempt -- CMS builder action label */}
              Versions
            </Button>
          </Tooltip>
          {/* i18n-exempt -- CMS builder control hint */}
          <Tooltip text="Save version snapshot (Ctrl/⌘+Shift+S)">
            <Button
              variant="outline"
              onClick={() => {
                try { window.dispatchEvent(new Event("pb:save-version")); } catch {}
              }}
            >
              {/* i18n-exempt -- CMS builder action label */}
              Save Version
            </Button>
          </Tooltip>
        </>
      )}
    </div>
  );
}
