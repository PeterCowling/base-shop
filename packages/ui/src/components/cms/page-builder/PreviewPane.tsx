"use client";

import { useMemo } from "react";
import type { Locale } from "@acme/i18n/locales";
import type { PageComponent, HistoryState } from "@acme/types";
import { decorateTreeForViewport } from "./state/layout/utils";
import { devicePresets, type DevicePreset } from "../../../utils/devicePresets";
import useViewport from "./hooks/useViewport";
import DeviceSelector from "../../common/DeviceSelector";
import DynamicRenderer from "../../DynamicRenderer";
import usePreviewTokens from "./hooks/usePreviewTokens";

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
    const hideByBp = (nodes: PageComponent[]): PageComponent[] =>
      nodes.map((n) => {
        const flags = (editor ?? {})[n.id] as any;
        const hiddenIds = (flags?.hiddenDeviceIds as string[] | undefined) ?? [];
        const hideHere = hiddenIds.includes(bpId!);
        const kids = (n as any).children as PageComponent[] | undefined;
        const merged: any = { ...n, ...(hideHere ? { hidden: true } : {}) };
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
        style={{ ...viewportStyle, ...(previewTokens as any) }}
      >
        <DynamicRenderer components={decorated} locale={locale} editor={editor} />
      </div>
    </div>
  );
};

export default PreviewPane;
