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
}

const PreviewPane = ({ components, locale, deviceId, onChange, editor }: Props) => {
  const previewDevice = useMemo<DevicePreset>(
    () =>
      devicePresets.find((d: DevicePreset) => d.id === deviceId) ??
      devicePresets[0],
    [deviceId]
  );
  const previewViewport: "desktop" | "tablet" | "mobile" = previewDevice.type;
  const { viewportStyle, frameClass } = useViewport(previewDevice);

  const decorated = decorateTreeForViewport(components, editor, previewViewport);
  const previewTokens = usePreviewTokens();
  return (
    <div className="flex flex-col gap-2 shrink-0">
      <DeviceSelector
        deviceId={deviceId}
        onChange={onChange}
        showLegacyButtons
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
