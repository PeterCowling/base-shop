"use client";

import React from "react";
import { Button } from "../../atoms/shadcn";
import { Tooltip } from "../../atoms";
import { Spinner } from "../../atoms";
import { useTranslations } from "@acme/i18n";

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
export default function TopActionBar({ onSave, onPublish, saving = false, publishing = false, showPreview, togglePreview, showVersions = true, showPreviewButton = true, publishLabel }: Props) {
  const t = useTranslations();
  const publishText = publishLabel ?? t("cms.builder.topBar.publish");
  return (
    <div className="flex w-full items-center justify-end gap-2">
      <Tooltip text={t("cms.builder.topBar.save.tooltip")}>
        <Button onClick={onSave} disabled={saving}>
          {saving ? <Spinner className="h-4 w-4" /> : t("cms.builder.topBar.save")}
        </Button>
      </Tooltip>
      <Tooltip text={publishText}>
        <Button
          variant="default"
          className="h-9 px-4"
          onClick={onPublish}
          disabled={publishing}
          data-tour="publish"
        >
          {publishing ? <Spinner className="h-4 w-4" /> : publishText}
        </Button>
      </Tooltip>
      {showPreviewButton && typeof showPreview === 'boolean' && togglePreview && (
        <Tooltip text={t("cms.builder.topBar.preview.toggle.tooltip")}>
          <Button
            variant="outline"
            className="h-9 px-3 text-sm"
            onClick={() => {
              const next = !showPreview;
              try {
                window.dispatchEvent(new CustomEvent('pb:notify', { detail: { type: 'preview', title: next ? t('cms.builder.preview.enabled') : t('cms.builder.preview.disabled') } }));
              } catch {}
              togglePreview();
            }}
            aria-label={showPreview ? t("cms.builder.topBar.preview.hide") : t("cms.builder.topBar.preview.show")}
            title={showPreview ? t("cms.builder.topBar.preview.hide") : t("cms.builder.topBar.preview.show")}
          >
            {showPreview ? t("cms.builder.topBar.mode.editing") : t("cms.builder.preview.title")}
          </Button>
        </Tooltip>
      )}
      {showVersions && (
        <>
          <Tooltip text={t("cms.builder.topBar.versions.tooltip")}>
            <Button
              variant="outline"
              onClick={() => {
                try { window.dispatchEvent(new Event("pb:open-versions")); } catch {}
              }}
            >
              {t("cms.builder.topBar.versions")}
            </Button>
          </Tooltip>
          <Tooltip text={t("cms.builder.topBar.saveVersion.tooltip")}>
            <Button
              variant="outline"
              onClick={() => {
                try { window.dispatchEvent(new Event("pb:save-version")); } catch {}
              }}
            >
              {t("cms.builder.topBar.saveVersion")}
            </Button>
          </Tooltip>
        </>
      )}
    </div>
  );
}
