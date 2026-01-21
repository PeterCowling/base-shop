"use client";
/* eslint-disable react/forbid-dom-props -- LINT-1006: PreviewPane requires inline styles for device frame and token variables */

import { type CSSProperties,useMemo } from "react";

import type { Locale } from "@acme/i18n/locales";
import type { HistoryState,PageComponent } from "@acme/types";

import { type DevicePreset,devicePresets } from "@acme/ui/utils/devicePresets";
import DeviceSelector from "@acme/ui/components/DeviceSelector";
import DynamicRenderer from "@acme/ui/components/DynamicRenderer";

import usePreviewTokens from "./hooks/usePreviewTokens";
import useViewport from "./hooks/useViewport";
import { decorateTreeForViewport } from "./state/layout/utils";

interface Props {
  components: PageComponent[];
  locale: Locale;
  deviceId: string;
  onChange: (id: string) => void;
  editor?: HistoryState["editor"];
  /** Optional extra devices from page breakpoints */
  extraDevices?: import("../../../utils/devicePresets").DevicePreset[];
}

const PreviewPane = ({ components, locale, deviceId, onChange, editor, extraDevices = [] }: Props) => {
  const previewDevice = useMemo<DevicePreset>(() => {
    const list = [...extraDevices, ...devicePresets];
    return list.find((d: DevicePreset) => d.id === deviceId) ?? list[0];
  }, [deviceId, extraDevices]);
  const previewViewport: "desktop" | "tablet" | "mobile" = previewDevice.type;
  const { viewportStyle, frameClass } = useViewport(previewDevice);

  let decorated = decorateTreeForViewport(components, editor, previewViewport);
  // Apply custom device visibility when the selected device is a page breakpoint
  const bpId = deviceId.startsWith("bp-") ? deviceId.slice(3) : null;
  if (bpId) {
    type ExtendedComponent = PageComponent & { hidden?: boolean; children?: PageComponent[] };
    const map: NonNullable<HistoryState["editor"]> = editor ?? {};
    const hideByBp = (nodes: PageComponent[]): PageComponent[] =>
      nodes.map((n) => {
        const flags = map[n.id];
        const hiddenIds = (flags?.hiddenDeviceIds ?? []) as string[];
        const hideHere = hiddenIds.includes(bpId);
        const kids = (n as ExtendedComponent).children;
        const merged: ExtendedComponent = { ...n, ...(hideHere ? { hidden: true } : {}) };
        if (Array.isArray(kids)) merged.children = hideByBp(kids);
        return merged as PageComponent;
      });
    decorated = hideByBp(decorated);
  }
  const previewTokens = usePreviewTokens();
  return (
    <div className="flex flex-col gap-2 shrink-0">
      <DeviceSelector
        deviceId={deviceId}
        onChange={onChange}
        showLegacyButtons
        extraDevices={extraDevices}
      />
      <div
        className={`${frameClass[previewViewport]} shrink-0`}
        style={{ ...viewportStyle, ...(previewTokens as unknown as CSSProperties) }}
      >
        <DynamicRenderer components={decorated} locale={locale} editor={editor} />
      </div>
    </div>
  );
};

export default PreviewPane;
