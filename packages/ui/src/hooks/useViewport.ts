import * as React from "react";
import type { Viewport } from "../components/organisms/types";

const getViewport = (): Viewport => {
  if (typeof window === "undefined") return "desktop";
  if (typeof window.matchMedia !== "function") return "desktop";
  if (window.matchMedia(/* i18n-exempt -- DS-1234 [ttl=2025-11-30] */ "(min-width: 1024px)").matches) return "desktop";
  if (window.matchMedia(/* i18n-exempt -- DS-1234 [ttl=2025-11-30] */ "(min-width: 768px)").matches) return "tablet";
  return "mobile";
};

export default function useViewport(): Viewport {
  const [viewport, setViewport] = React.useState<Viewport>(getViewport);
  React.useEffect(() => {
    const handler = () => setViewport(getViewport());
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return viewport;
}
