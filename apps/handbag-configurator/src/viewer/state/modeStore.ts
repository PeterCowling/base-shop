import { create } from "zustand";
import type { ProductConfigSchema } from "@acme/product-configurator";

export type ViewerMode = "showroom" | "explore" | "configure";

export type ActiveRegionId = ProductConfigSchema["regions"][number]["regionId"];

type ModeState = {
  mode: ViewerMode;
  lastNonConfigureMode: Exclude<ViewerMode, "configure">;
  panelOpen: boolean;
  activeRegionId: ActiveRegionId | null;
  activeHotspotId: string | null;
  basicMode: boolean;
  bagOpen: boolean;
  hotspotConfigMode: boolean;
  setMode: (mode: ViewerMode) => void;
  enterExplore: () => void;
  exitExplore: () => void;
  openPanel: () => void;
  openPanelForRegion: (regionId: ActiveRegionId) => void;
  openPanelForHotspot: (hotspotId: string, regionId: ActiveRegionId) => void;
  closePanel: () => void;
  setActiveRegion: (regionId: ActiveRegionId) => void;
  clearActiveRegion: () => void;
  clearActiveHotspot: () => void;
  setBasicMode: (basicMode: boolean) => void;
  setBagOpen: (bagOpen: boolean) => void;
  setHotspotConfigMode: (hotspotConfigMode: boolean) => void;
};

export const useModeStore = create<ModeState>((set) => ({
  mode: "showroom",
  lastNonConfigureMode: "showroom",
  panelOpen: false,
  activeRegionId: null,
  activeHotspotId: null,
  basicMode: true,
  bagOpen: false,
  hotspotConfigMode: false,
  setMode: (mode) =>
    set((state) => {
      if (mode === "configure") {
      return {
        mode,
        panelOpen: true,
        activeRegionId: state.activeRegionId,
        activeHotspotId: state.activeHotspotId,
        lastNonConfigureMode:
          state.mode === "configure"
            ? state.lastNonConfigureMode
            : (state.mode as Exclude<ViewerMode, "configure">),
        };
      }
      return {
        mode,
        panelOpen: false,
        activeRegionId: state.activeRegionId,
        lastNonConfigureMode: mode,
      };
    }),
  enterExplore: () =>
    set(() => ({
      mode: "explore",
      panelOpen: false,
      activeHotspotId: null,
      lastNonConfigureMode: "explore",
    })),
  exitExplore: () =>
    set(() => ({
      mode: "showroom",
      panelOpen: false,
      activeHotspotId: null,
      lastNonConfigureMode: "showroom",
    })),
  openPanel: () =>
    set((state) => ({
      mode: "configure",
      panelOpen: true,
      activeRegionId: state.activeRegionId,
      activeHotspotId: state.activeHotspotId,
      lastNonConfigureMode:
        state.mode === "configure"
          ? state.lastNonConfigureMode
          : (state.mode as Exclude<ViewerMode, "configure">),
    })),
  openPanelForRegion: (regionId) =>
    set((state) => ({
      mode: "configure",
      panelOpen: true,
      activeRegionId: regionId,
      activeHotspotId: null,
      lastNonConfigureMode:
        state.mode === "configure"
          ? state.lastNonConfigureMode
          : (state.mode as Exclude<ViewerMode, "configure">),
    })),
  openPanelForHotspot: (hotspotId, regionId) =>
    set((state) => ({
      mode: "configure",
      panelOpen: true,
      activeRegionId: regionId,
      activeHotspotId: hotspotId,
      lastNonConfigureMode:
        state.mode === "configure"
          ? state.lastNonConfigureMode
          : (state.mode as Exclude<ViewerMode, "configure">),
    })),
  closePanel: () =>
    set((state) => ({
      mode: state.lastNonConfigureMode,
      panelOpen: false,
    })),
  setActiveRegion: (regionId) =>
    set(() => ({ activeRegionId: regionId, activeHotspotId: null })),
  clearActiveRegion: () =>
    set(() => ({ activeRegionId: null, activeHotspotId: null })),
  clearActiveHotspot: () => set(() => ({ activeHotspotId: null })),
  setBasicMode: (basicMode) => set(() => ({ basicMode })),
  setBagOpen: (bagOpen) => set(() => ({ bagOpen })),
  setHotspotConfigMode: (hotspotConfigMode) => set(() => ({ hotspotConfigMode })),
}));
