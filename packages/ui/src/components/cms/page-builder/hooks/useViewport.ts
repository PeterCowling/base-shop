"use client";
import { useEffect, useMemo, useRef, useState } from "react";

import type { DevicePreset } from "../../../../utils/devicePresets";

const useViewport = (device: DevicePreset) => {
  const [canvasWidth, setCanvasWidth] = useState(device.width);
  const [canvasHeight, setCanvasHeight] = useState(device.height);
  const [scale, setScale] = useState(1);
  const prevWidth = useRef(device.width);

  useEffect(() => {
    const prev = prevWidth.current;
    setCanvasWidth(device.width);
    setCanvasHeight(device.height);
    setScale(prev / device.width);
    const raf = requestAnimationFrame(() => setScale(1));
    prevWidth.current = device.width;
    return () => cancelAnimationFrame(raf);
  }, [device]);

  const viewportStyle = useMemo(
    () => ({
      width: `${canvasWidth}px`,
      height: `${canvasHeight}px`,
      transform: `scale(${scale})`,
      transformOrigin: "top center", // i18n-exempt -- PB-235: CSS value
      transition: "transform 0.3s ease", // i18n-exempt -- PB-235: CSS value
    }),
    [canvasWidth, canvasHeight, scale]
  );

  const frameClass = useMemo(
    () => ({
      desktop: "", // i18n-exempt -- PB-235: class name
      tablet: "rounded-xl border border-muted-foreground/40 p-2", // i18n-exempt -- PB-235: class name
      mobile: "rounded-4xl border border-muted-foreground/40 p-4", // i18n-exempt -- PB-235: class name
    }),
    []
  );

  return { canvasWidth, canvasHeight, scale, viewportStyle, frameClass };
};

export default useViewport;
