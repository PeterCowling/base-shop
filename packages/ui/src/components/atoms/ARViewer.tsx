/// <reference path="../../types/model-viewer.d.ts" />

import * as React from "react";
import { cn } from "../../utils/cn";

export interface ARViewerProps extends React.HTMLAttributes<HTMLElement> {
  src: string;
}

export function ARViewer({ src, className, ...props }: ARViewerProps) {
  React.useEffect(() => {
    if (customElements.get("model-viewer")) return;
    const script = document.createElement("script");
    script.type = "module";
    script.src =
      "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <model-viewer
      src={src}
      ar
      camera-controls
      className={cn("h-full w-full", className)}
      {...props}
    />
  );
}
