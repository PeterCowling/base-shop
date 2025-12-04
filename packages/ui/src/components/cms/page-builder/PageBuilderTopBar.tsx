import type { ComponentProps, ReactNode } from "react";
import { useTranslations } from "@acme/i18n";
import { CheckIcon, ReloadIcon, CopyIcon } from "@radix-ui/react-icons";
import { Tooltip } from "../../atoms";
import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger } from "../../atoms/shadcn";
import PageToolbar from "./PageToolbar";
import HistoryControls from "./HistoryControls";
import ResponsiveRightActions from "./ResponsiveRightActions";
import PresenceAvatars from "./PresenceAvatars";
import StudioMenu from "./StudioMenu";
import TopActionBar from "./TopActionBar";
import NotificationsBell from "./NotificationsBell";
import type GridSettings from "./GridSettings";
import type { PageComponent } from "@acme/types";
import { Inline } from "../../atoms/primitives/Inline";
import { derivePublishState } from "./state/publishStatus";
import { Tooltip as SmallTooltip } from "../../atoms";

interface PageBuilderTopBarProps {
  historyProps: ComponentProps<typeof HistoryControls>;
  showPreview: boolean;
  togglePreview: () => void;
  mode: "page" | "section";
  shop?: string | null;
  pageId?: string | null;
  toolbarProps: ComponentProps<typeof PageToolbar>;
  gridProps: ComponentProps<typeof GridSettings>;
  onInsertPreset?: (component: PageComponent) => void;
  presetsSourceUrl?: string;
  startTour: () => void;
  toggleComments: () => void;
  showComments: boolean;
  showPalette: boolean;
  onTogglePalette: () => void;
  parentFirst?: boolean;
  onParentFirstChange?: (v: boolean) => void;
  crossBreakpointNotices?: boolean;
  onCrossBreakpointNoticesChange?: (v: boolean) => void;
  showInspector: boolean;
  onToggleInspector: () => void;
  helpOpen: boolean;
  onHelpOpenChange: (open: boolean) => void;
  // Presets authoring
  canSavePreset?: boolean;
  onSavePreset?: () => void;
  templateActions?: ReactNode;
  publishMeta?: {
    status: "draft" | "published";
    updatedAt?: string;
    publishedAt?: string;
    publishedBy?: string;
  };
  previewUrl?: string | null;
  previewSource?: string | null;
}

const PageBuilderTopBar = ({
  historyProps,
  showPreview,
  togglePreview,
  mode,
  shop,
  pageId,
  toolbarProps,
  gridProps,
  onInsertPreset,
  presetsSourceUrl,
  startTour,
  toggleComments,
  showComments,
  showPalette,
  onTogglePalette,
  parentFirst,
  onParentFirstChange,
  crossBreakpointNotices,
  onCrossBreakpointNoticesChange,
  showInspector,
  onToggleInspector,
  helpOpen,
  onHelpOpenChange,
  canSavePreset,
  onSavePreset,
  templateActions,
  publishMeta,
  previewUrl,
  previewSource,
}: PageBuilderTopBarProps) => {
  const t = useTranslations();
  const publishState = publishMeta
    ? derivePublishState({
        status: publishMeta.status,
        updatedAt: publishMeta.updatedAt,
        publishedAt: publishMeta.publishedAt,
        publishedRevisionId: publishMeta.publishedRevisionId,
        currentRevisionId: publishMeta.currentRevisionId,
      })
    : "draft";
  const statusLabel =
    publishState === "changed"
      ? t("cms.builder.status.unpublishedChanges")
      : publishMeta?.status === "published"
        ? t("cms.pages.status.published")
        : t("cms.pages.status.draft");
  const publishedInfo =
    publishMeta?.publishedAt && publishMeta.publishedAt.trim().length > 0
      ? new Date(publishMeta.publishedAt).toLocaleString()
      : null;
  const updatedInfo =
    publishMeta?.updatedAt && publishMeta.updatedAt.trim().length > 0
      ? new Date(publishMeta.updatedAt).toLocaleString()
      : null;
  const statusChipClass =
    publishState === "changed"
      ? "bg-warning/20 text-warning-foreground" // i18n-exempt -- DS-3471 non-UI style token for publish state chip [ttl=2026-12-31]
      : "bg-muted text-muted-foreground"; // i18n-exempt -- DS-3471 non-UI style token for publish state chip [ttl=2026-12-31]
  const previewWindowFeatures = "noopener,noreferrer"; // i18n-exempt -- DS-3471 browser window features string, not user-facing [ttl=2026-12-31]

  return (
  <div className="sticky top-0 w-full overflow-x-hidden bg-surface-1/95 backdrop-blur">
    <div className="flex w-full items-center gap-2 py-2">
      <Inline gap={2} alignY="center" className="min-w-0">
        {historyProps?.autoSaveState === "saving" && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ReloadIcon className="h-3 w-3 animate-spin" /> {t("actions.saving")}
          </span>
        )}
        {historyProps?.autoSaveState === "saved" && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <CheckIcon className="h-3 w-3" /> {t("actions.autosaved")}
          </span>
        )}
        <SmallTooltip
          text={
            publishMeta?.publishedBy
              ? t("cms.builder.status.publishedBy", { name: publishMeta.publishedBy })
              : undefined
          }
        >
          <span className="inline-flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${statusChipClass}`}
              data-testid="publish-status-chip" // i18n-exempt -- DS-3471 testing hook, not user copy [ttl=2026-12-31]
            >
              {statusLabel}
            </span>
            {publishedInfo && (
              <span className="text-xs text-muted-foreground">
                {publishState === "changed"
                  ? t("cms.builder.status.lastPublished", { date: publishedInfo })
                  : t("cms.builder.status.publishedAt", { date: publishedInfo })}
              </span>
            )}
            {updatedInfo && (
              <span className="text-xs text-muted-foreground">
                {t("cms.builder.status.lastSaved", { date: updatedInfo })}
              </span>
            )}
          </span>
        </SmallTooltip>
      </Inline>
      <div className="min-w-0 flex-1" />
      <TopActionBar
        onSave={historyProps.onSave}
        onPublish={historyProps.onPublish}
        saving={historyProps.saving}
        publishing={historyProps.publishing}
        showPreview={showPreview}
        togglePreview={togglePreview}
        showVersions={mode !== "section"}
        publishLabel={mode === "section" ? (t("cms.builder.publish.section") as string) : (t("actions.publish") as string)}
      />
      <NotificationsBell shop={shop ?? null} pageId={pageId ?? null} />
      {/* Quick access to NextAuth session for debugging */}
      <Button asChild variant="outline" size="sm" aria-label={t("dev.viewSession") as string}>
        <a href="/api/auth/session" target="_blank" rel="noreferrer">{t("dev.session")}</a>
      </Button>
      <Dialog open={helpOpen} onOpenChange={onHelpOpenChange}>
        <DialogTrigger asChild>
          <Tooltip text={t("cms.builder.help.keyboardMouse")}>
            <Button variant="outline" size="icon" aria-label={t("actions.help") as string}>
              ?
            </Button>
          </Tooltip>
        </DialogTrigger>
        <DialogContent className="space-y-2">
          <DialogTitle>{t("cms.builder.help.keyboardMouse")}</DialogTitle>
          <ul className="space-y-1 text-sm">
            <li className="font-medium mt-1">{t("cms.builder.help.mouse")}</li>
            <li>
              {t("cms.builder.help.mouse.dragResize", { Shift: "Shift" })}
            </li>
            <li>{t("cms.builder.help.mouse.quickSizing")}</li>
            <li>
              {t("cms.builder.help.mouse.pan", { Space: "Space" })}
            </li>
            <li className="font-medium mt-3">{t("cms.builder.help.keyboard")}</li>
            <li>
              <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>S</kbd> {t("actions.save")}
            </li>
            <li>
              <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Alt</kbd> + <kbd>P</kbd>
              {t("actions.togglePreview")}
            </li>
            <li>
              <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>B</kbd> {t("actions.togglePalette")}
            </li>
            <li>
              <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>
              {t("actions.publish")}
            </li>
            <li>
              <kbd>Shift</kbd> + <kbd>Arrow</kbd> {t("cms.builder.help.keyboard.resizeSelection")}
            </li>
            <li>
              {t("cms.builder.help.keyboard.lockAxis", { Shift: "Shift" })}
            </li>
            <li>
              <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Arrow</kbd> {t("cms.builder.help.keyboard.adjustSpacing")}
            </li>
            <li>
              {t("cms.builder.help.keyboard.moveComponents", { Space: "Space", Enter: "Enter", Arrow: "Arrow", Esc: "Esc" })}
            </li>
            <li className="text-xs text-muted-foreground">
              {t("cms.builder.help.keyboard.snapInfo")}
            </li>
            <li>
              <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>[</kbd>
              {t("cms.builder.help.keyboard.rotateLeft")}
            </li>
            <li>
              <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>]</kbd>
              {t("cms.builder.help.keyboard.rotateRight")}
            </li>
            <li>
              <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Z</kbd> {t("actions.undo")}
            </li>
            <li>
              <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Y</kbd> {t("actions.redo")}
            </li>
            <li>
              <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>1</kbd> {t("cms.builder.view.desktop")}
            </li>
            <li>
              <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>2</kbd> {t("cms.builder.view.tablet")}
            </li>
            <li>
              <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>3</kbd> {t("cms.builder.view.mobile")}
            </li>
            <li>
              <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd>
              {t("cms.builder.versions.saveVersion")}
            </li>
            <li>
              <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd>
              {t("cms.builder.versions.openVersions")}
            </li>
          </ul>
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={() => {
                try {
                  startTour();
                } finally {
                  onHelpOpenChange(false);
                }
              }}
            >
              {t("cms.builder.tour.start")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    <div className="flex w-full flex-wrap items-center gap-2 py-2">
      <div className="flex items-center gap-2">
        <StudioMenu shop={shop ?? null} />
      </div>
      <div data-tour="toolbar" className="min-w-0 flex-1 overflow-x-hidden">
        <PageToolbar
          {...toolbarProps}
          hideDeviceManager={mode === "section"}
          hidePagesNav={mode === "section"}
          pagesNav={mode === "section" ? undefined : toolbarProps.pagesNav}
        />
      </div>
      <div className="flex items-center gap-2">
        {/* Quick access to Presets modal */}
        {typeof window !== 'undefined' && (
          <Tooltip text={t("cms.builder.presets.insertLayout.tooltip")}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                try { window.dispatchEvent(new Event("pb:open-presets")); } catch {}
              }}
              aria-label={t("cms.builder.presets.insertPreset") as string}
            >
              {t("cms.builder.presets.insertPreset")}
            </Button>
          </Tooltip>
        )}
        {previewUrl && (
          <Tooltip
            text={
              previewSource
                ? t("cms.builder.preview.source", { source: previewSource })
                : t("cms.builder.preview.default")
            }
          >
            <div className="inline-flex gap-2">
              <Button
                variant="outline"
                size="sm"
                aria-label={t("cms.builder.preview.openLabel") as string}
                className="min-w-28"
                onClick={async () => {
                  try {
                    await Promise.resolve(historyProps.onSave());
                  } catch {
                    /* ignore save failure here; main save flow already surfaces errors */
                  }
                  try {
                    window.open(previewUrl, "_blank", previewWindowFeatures);
                  } catch {
                    /* noop */
                  }
                }}
              >
                {previewSource === "stage"
                  ? t("cms.builder.preview.stage")
                  : t("cms.builder.preview.open")}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("cms.builder.preview.copyLink") as string}
                onClick={() => {
                  try {
                    void navigator.clipboard?.writeText(previewUrl);
                    window.dispatchEvent(
                      new CustomEvent("pb:notify", {
                        detail: { type: "info", title: t("cms.builder.preview.linkCopied") },
                      }),
                    );
                  } catch {
                    /* ignore */
                  }
                }}
              >
                <CopyIcon className="h-4 w-4" />
              </Button>
            </div>
          </Tooltip>
        )}
        {!previewUrl && (
          <Tooltip text={t("cms.builder.preview.unavailable")}>
            <Button
              variant="outline"
              size="sm"
              aria-label={t("cms.builder.preview.unavailableTitle") as string}
              disabled
              onClick={() => {
                try {
                  window.dispatchEvent(
                    new CustomEvent("pb:notify", {
                      detail: {
                        type: "error",
                        title: t("cms.builder.preview.unavailableTitle"),
                        message: t("cms.builder.preview.unavailableConfigure"),
                      },
                    }),
                  );
                } catch {
                  /* noop */
                }
              }}
              >
                {t("cms.builder.preview.unavailable")}
              </Button>
            </Tooltip>
          )}
        {templateActions}
        {onSavePreset && (
          <Tooltip text={canSavePreset ? t("cms.builder.presets.saveSelected.tooltip") : t("cms.builder.presets.selectToSave.tooltip")}>
            <Button variant="outline" size="sm" disabled={!canSavePreset} onClick={onSavePreset} aria-disabled={!canSavePreset}>
              {t("cms.builder.presets.saveAsPreset")}
            </Button>
          </Tooltip>
        )}
        <ResponsiveRightActions
          gridProps={gridProps}
          onInsertPreset={onInsertPreset}
          presetsSourceUrl={presetsSourceUrl}
          startTour={startTour}
          toggleComments={toggleComments}
          showComments={showComments}
          togglePreview={togglePreview}
          showPreview={showPreview}
          showPalette={showPalette}
          togglePalette={onTogglePalette}
          parentFirst={parentFirst}
          onParentFirstChange={onParentFirstChange}
          crossBreakpointNotices={crossBreakpointNotices}
          onCrossBreakpointNoticesChange={onCrossBreakpointNoticesChange}
        />
        <PresenceAvatars shop={shop ?? null} pageId={pageId ?? null} />
        <HistoryControls
          {...historyProps}
          showUndoRedo
          showSavePublish={false}
          showVersions={false}
        />
        <button
          type="button"
          className="rounded border px-2 py-1 text-sm min-h-10 min-w-10"
          onClick={onToggleInspector}
          aria-label={showInspector ? (t("cms.builder.inspector.hide") as string) : (t("cms.builder.inspector.show") as string)}
          title={showInspector ? (t("cms.builder.inspector.hide") as string) : (t("cms.builder.inspector.show") as string)}
        >
          {showInspector ? (
            <span className="inline-flex items-center" aria-hidden>
              ›
            </span>
          ) : (
            <span className="inline-flex items-center" aria-hidden>
              ‹
            </span>
          )}
        </button>
      </div>
    </div>
  </div>
  );
};

export default PageBuilderTopBar;
