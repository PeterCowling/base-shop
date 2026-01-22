// packages/ui/src/components/cms/page-builder/panels/layout/PositionControls.tsx
"use client";

import { Tooltip } from "@acme/design-system/atoms";
import { Button,Select, SelectContent, SelectItem, SelectTrigger, SelectValue  } from "@acme/design-system/shadcn";
import type { PageComponent } from "@acme/types";
import useLocalStrings from "@acme/ui/components/cms/page-builder/hooks/useLocalStrings";

import UnitInput from "./UnitInput";

interface Props {
  component: PageComponent;
  locked: boolean;
  handleInput: <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void;
  handleResize: (field: string, value: string) => void;
  errorKeys?: Set<string>;
}

export default function PositionControls({ component, locked, handleInput, handleResize, errorKeys }: Props) {
  const t = useLocalStrings();
  // CSS utility class list for error ring
  const ERROR_RING_CLASS = "ring-1 ring-red-500"; // i18n-exempt -- INTL-204 CSS utility classes only [ttl=2026-12-31]
  return (
    <>
      <Select
        value={component.position ?? ""}
        onValueChange={(v) => handleInput("position", (v || undefined) as PageComponent["position"])}
      >
        <Tooltip text={t("position_property_hint")} className="block">
          <SelectTrigger className={errorKeys?.has("position") ? ERROR_RING_CLASS : undefined} aria-invalid={errorKeys?.has("position") || undefined}>
            <SelectValue placeholder={t("position_label")} />
          </SelectTrigger>
        </Tooltip>
        <SelectContent>
          {/* i18n-exempt: CSS keywords */}
          <SelectItem value="relative">relative</SelectItem>
          <SelectItem value="absolute">absolute</SelectItem>
        </SelectContent>
      </Select>
      {component.position === "absolute" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={component.dockX ?? "left"}
              onValueChange={(v) => handleInput("dockX", v as typeof component.dockX)}
            >
              <Tooltip text={t("dock_x_hint")}>
                <SelectTrigger>
                  <SelectValue placeholder={t("dock_x_label")} />
                </SelectTrigger>
              </Tooltip>
              <SelectContent>
                <SelectItem value="left">{t("dock_left")}</SelectItem>
                <SelectItem value="center">{t("dock_center")}</SelectItem>
                <SelectItem value="right">{t("dock_right")}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={component.dockY ?? "top"}
              onValueChange={(v) => handleInput("dockY", v as typeof component.dockY)}
            >
              <Tooltip text={t("dock_y_hint")}>
                <SelectTrigger>
                  <SelectValue placeholder={t("dock_y_label")} />
                </SelectTrigger>
              </Tooltip>
              <SelectContent>
                <SelectItem value="top">{t("dock_top")}</SelectItem>
                <SelectItem value="center">{t("dock_center")}</SelectItem>
                <SelectItem value="bottom">{t("dock_bottom")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <UnitInput
            componentId={component.id}
            label={t("offset_top_label")}
            placeholder={t("offset_placeholder")}
            value={component.top ?? ""}
            onChange={(v) => handleResize("top", v)}
            axis="h"
            disabled={locked}
            cssProp="top"
            extraError={errorKeys?.has("top")}
          />
          <UnitInput
            componentId={component.id}
            label={t("offset_left_label")}
            placeholder={t("offset_placeholder")}
            value={component.left ?? ""}
            onChange={(v) => handleResize("left", v)}
            axis="w"
            disabled={locked}
            cssProp="left"
            extraError={errorKeys?.has("left")}
          />
          <UnitInput
            componentId={component.id}
            label={t("offset_right_label")}
            placeholder={t("offset_placeholder")}
            value={component.right ?? ""}
            onChange={(v) => handleResize("right", v)}
            axis="w"
            disabled={locked}
            cssProp="right"
            extraError={errorKeys?.has("right")}
          />
          <UnitInput
            componentId={component.id}
            label={t("offset_bottom_label")}
            placeholder={t("offset_placeholder")}
            value={component.bottom ?? ""}
            onChange={(v) => handleResize("bottom", v)}
            axis="h"
            disabled={locked}
            cssProp="bottom"
            extraError={errorKeys?.has("bottom")}
          />
          {(() => {
            const isPinnedLeft = !!component.left;
            const isPinnedRight = !!component.right;
            const isPinnedTop = !!component.top;
            const isPinnedBottom = !!component.bottom;
            const pinLeft = () => {
              try {
                const el = document.querySelector(`[data-component-id="${component.id}"]`) as HTMLElement | null;
                const parent = (el?.offsetParent as HTMLElement | null) ?? el?.parentElement ?? null;
                if (!el || !parent) return;
                const rect = el.getBoundingClientRect();
                const pRect = parent.getBoundingClientRect();
                const left = Math.round(rect.left - pRect.left);
                handleInput("dockX", "left");
                handleResize("left", `${left}px`);
                handleResize("right", "");
              } catch {}
            };
            const pinRight = () => {
              try {
                const el = document.querySelector(`[data-component-id=\"${component.id}\"]`) as HTMLElement | null;
                const parent = (el?.offsetParent as HTMLElement | null) ?? el?.parentElement ?? null;
                if (!el || !parent) return;
                const rect = el.getBoundingClientRect();
                const pRect = parent.getBoundingClientRect();
                const right = Math.round(pRect.right - rect.right);
                handleInput("dockX", "right");
                handleResize("right", `${right}px`);
                handleResize("left", "");
              } catch {}
            };
            const pinTop = () => {
              try {
                const el = document.querySelector(`[data-component-id=\"${component.id}\"]`) as HTMLElement | null;
                const parent = (el?.offsetParent as HTMLElement | null) ?? el?.parentElement ?? null;
                if (!el || !parent) return;
                const rect = el.getBoundingClientRect();
                const pRect = parent.getBoundingClientRect();
                const top = Math.round(rect.top - pRect.top);
                handleInput("dockY", "top");
                handleResize("top", `${top}px`);
                handleResize("bottom", "");
              } catch {}
            };
            const pinBottom = () => {
              try {
                const el = document.querySelector(`[data-component-id=\"${component.id}\"]`) as HTMLElement | null;
                const parent = (el?.offsetParent as HTMLElement | null) ?? el?.parentElement ?? null;
                if (!el || !parent) return;
                const rect = el.getBoundingClientRect();
                const pRect = parent.getBoundingClientRect();
                const bottom = Math.round(pRect.bottom - rect.bottom);
                handleInput("dockY", "bottom");
                handleResize("bottom", `${bottom}px`);
                handleResize("top", "");
              } catch {}
            };
            const stretchX = () => {
              try {
                const el = document.querySelector(`[data-component-id=\"${component.id}\"]`) as HTMLElement | null;
                const parent = (el?.offsetParent as HTMLElement | null) ?? el?.parentElement ?? null;
                if (!el || !parent) return;
                const rect = el.getBoundingClientRect();
                const pRect = parent.getBoundingClientRect();
                const left = Math.round(rect.left - pRect.left);
                const right = Math.round(pRect.right - rect.right);
                handleInput("dockX", "left");
                handleResize("left", `${left}px`);
                handleResize("right", `${right}px`);
                handleInput("width", undefined);
              } catch {}
            };
            const stretchY = () => {
              try {
                const el = document.querySelector(`[data-component-id=\"${component.id}\"]`) as HTMLElement | null;
                const parent = (el?.offsetParent as HTMLElement | null) ?? el?.parentElement ?? null;
                if (!el || !parent) return;
                const rect = el.getBoundingClientRect();
                const pRect = parent.getBoundingClientRect();
                const top = Math.round(rect.top - pRect.top);
                const bottom = Math.round(pRect.bottom - rect.bottom);
                handleInput("dockY", "top");
                handleResize("top", `${top}px`);
                handleResize("bottom", `${bottom}px`);
                handleInput("height", undefined);
              } catch {}
            };
            return (
              <div className="mt-1 grid grid-cols-2 gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant={isPinnedLeft ? "default" : "outline"} disabled={locked} onClick={pinLeft} aria-label={t("pin_left")}>{t("pin_left")}</Button>
                  <Button type="button" variant={isPinnedRight ? "default" : "outline"} disabled={locked} onClick={pinRight} aria-label={t("pin_right")}>{t("pin_right")}</Button>
                  <Button type="button" variant={isPinnedTop ? "default" : "outline"} disabled={locked} onClick={pinTop} aria-label={t("pin_top")}>{t("pin_top")}</Button>
                  <Button type="button" variant={isPinnedBottom ? "default" : "outline"} disabled={locked} onClick={pinBottom} aria-label={t("pin_bottom")}>{t("pin_bottom")}</Button>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="outline" disabled={locked} onClick={stretchX} aria-label={t("aria_stretch_horizontally")}>{t("stretch_x")}</Button>
                  <Button type="button" variant="outline" disabled={locked} onClick={stretchY} aria-label={t("aria_stretch_vertically")}>{t("stretch_y")}</Button>
                </div>
              </div>
            );
          })()}
        </>
      )}
    </>
  );
}
