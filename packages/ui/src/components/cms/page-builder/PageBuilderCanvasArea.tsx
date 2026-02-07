import type {
  ComponentProps,
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react";
import { defaultDropAnimation, defaultDropAnimationSideEffects,DragOverlay } from "@dnd-kit/core";

import { useTranslations } from "@acme/i18n";

import type { ComponentType } from "./defaults";
import DevToolsOverlay from "./devtools/DevToolsOverlay";
import DragOverlayPreview, { type DragMeta } from "./DragOverlayPreview";
import EmptyCanvasOverlay from "./EmptyCanvasOverlay";
import ErrorBoundary from "./ErrorBoundary";
import type { PageBuilderLayoutProps } from "./PageBuilderLayout.types";
import PageCanvas from "./PageCanvas";
import PlaceholderAnimations from "./PlaceholderAnimations";
import PreviewPane from "./PreviewPane";

type CanvasProps = ComponentProps<typeof PageCanvas>;
type PreviewProps = PageBuilderLayoutProps["previewProps"];

// Translator for UI strings
const useT = () => useTranslations() as unknown as (key: string, vars?: Record<string, unknown>) => string;

interface PageBuilderCanvasAreaProps {
  scrollRef?: RefObject<HTMLDivElement | null>;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  zoom: number;
  frameClass: Record<string, string>;
  viewport: "desktop" | "tablet" | "mobile";
  viewportStyle: CSSProperties;
  canvasProps: CanvasProps;
  paletteOnAdd: (type: ComponentType) => void;
  showDevTools: boolean;
  dragMeta?: DragMeta | null;
  dropAllowed?: boolean | null;
  reducedMotion: boolean;
  activeType: ComponentType | null;
  toolbarLocale: string;
  previewProps: PreviewProps;
  showPreview: boolean;
  openPalette: () => void;
  setEditingSizePx?: (px: number | null) => void;
}

const PageBuilderCanvasArea = ({
  scrollRef,
  onPointerDown,
  zoom,
  frameClass,
  viewport,
  viewportStyle,
  canvasProps,
  paletteOnAdd,
  showDevTools,
  dragMeta,
  dropAllowed,
  reducedMotion,
  activeType,
  toolbarLocale,
  previewProps,
  showPreview,
  openPalette,
  setEditingSizePx,
}: PageBuilderCanvasAreaProps) => {
  const t = useT();
  return (
  <>
    <PlaceholderAnimations />
    <div className="flex flex-1 gap-4 min-h-0">
      <ErrorBoundary>
        <div
          ref={scrollRef}
          className="relative max-h-full overflow-auto overscroll-contain min-h-0"
          onPointerDown={onPointerDown}
        >
          {/* eslint-disable-next-line react/forbid-dom-props -- PB-2419: canvas zoom uses dynamic inline transform for accuracy */}
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
            <div
              className={`${frameClass[viewport]} shrink-0`}
              /* eslint-disable-next-line react/forbid-dom-props -- PB-2419: dynamic frame sizing from toolbar requires inline style */
              style={viewportStyle}
              data-tour="canvas"
              data-viewport={viewport}
            >
              <div className="relative">
                {setEditingSizePx && (
                  <>
                    <div
                      role="separator"
                      aria-label={t("pb.canvas.resizeNarrowerAria")}
                      className="absolute start-0 top-0 h-full w-1 cursor-col-resize bg-transparent"
                      onPointerDown={(event) => {
                        const host = event.currentTarget.parentElement as HTMLElement | null;
                        if (!host) return;
                        const startX = event.clientX;
                        const startW = host.offsetWidth / (zoom || 1);
                        const onMove = (ev: PointerEvent) => {
                          const dx = (ev.clientX - startX) / (zoom || 1);
                          const next = Math.max(320, Math.min(1920, Math.round(startW - dx)));
                          setEditingSizePx(next);
                        };
                        const onUp = () => {
                          window.removeEventListener("pointermove", onMove);
                          window.removeEventListener("pointerup", onUp);
                        };
                        window.addEventListener("pointermove", onMove);
                        window.addEventListener("pointerup", onUp);
                      }}
                    />
                    <div
                      role="separator"
                      aria-label={t("pb.canvas.resizeWiderAria")}
                      className="absolute end-0 top-0 h-full w-1 cursor-col-resize bg-transparent"
                      onPointerDown={(event) => {
                        const host = event.currentTarget.parentElement as HTMLElement | null;
                        if (!host) return;
                        const startX = event.clientX;
                        const startW = host.offsetWidth / (zoom || 1);
                        const onMove = (ev: PointerEvent) => {
                          const dx = (ev.clientX - startX) / (zoom || 1);
                          const next = Math.max(320, Math.min(1920, Math.round(startW + dx)));
                          setEditingSizePx(next);
                        };
                        const onUp = () => {
                          window.removeEventListener("pointermove", onMove);
                          window.removeEventListener("pointerup", onUp);
                        };
                        window.addEventListener("pointermove", onMove);
                        window.addEventListener("pointerup", onUp);
                      }}
                    />
                  </>
                )}
                <PageCanvas {...canvasProps} />
                {canvasProps.components.length === 0 && (
                  <EmptyCanvasOverlay
                    onAddSection={() => paletteOnAdd("Section" as ComponentType)}
                    onOpenPalette={openPalette}
                    onOpenPresets={() => window.dispatchEvent(new Event("pb:open-presets"))}
                  />
                )}
              </div>
              {showDevTools && <DevToolsOverlay scrollRef={scrollRef} />}
            </div>
          </div>
        </div>
        <DragOverlay
          dropAnimation={
            reducedMotion
              ? { duration: 0, easing: "linear" }
              : {
                  ...defaultDropAnimation,
                  duration: 220,
                  // i18n-exempt -- PB-2419 animation curve string, not user copy
                  easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
                  sideEffects: defaultDropAnimationSideEffects({
                    styles: { active: { opacity: "0.25" } },
                  }),
                }
          }
        >
          {dragMeta ? (
            <DragOverlayPreview dragMeta={dragMeta} allowed={dropAllowed ?? null} locale={toolbarLocale} />
          ) : activeType ? (
            <div className="pointer-events-none rounded border bg-muted px-4 py-2 opacity-50 shadow">{activeType}</div>
          ) : null}
        </DragOverlay>
        {showPreview && <PreviewPane {...previewProps} />}
      </ErrorBoundary>
    </div>
  </>
  );
};

export default PageBuilderCanvasArea;
