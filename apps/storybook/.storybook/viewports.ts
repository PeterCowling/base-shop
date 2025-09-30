import type { ViewportMap } from "storybook/viewport";
import { MINIMAL_VIEWPORTS } from "storybook/viewport";

const customViewports: ViewportMap = {
  desktop: {
    name: "Desktop • 1280×800",
    styles: { width: "1280px", height: "800px" },
    type: "desktop",
  },
};

export const VIEWPORTS: ViewportMap = {
  ...MINIMAL_VIEWPORTS,
  ...customViewports,
};

export const DEFAULT_VIEWPORT = "desktop";
