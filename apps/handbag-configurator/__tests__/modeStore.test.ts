import { useModeStore } from "../src/viewer/state/modeStore";

const initialState = useModeStore.getState();

afterEach(() => {
  useModeStore.setState(initialState, true);
});

describe("useModeStore", () => {
  it("tracks last non-configure mode when entering configure", () => {
    const store = useModeStore.getState();

    store.setMode("explore");
    store.setMode("configure");

    let state = useModeStore.getState();
    expect(state.mode).toBe("configure");
    expect(state.panelOpen).toBe(true);
    expect(state.lastNonConfigureMode).toBe("explore");

    store.setMode("configure");
    state = useModeStore.getState();
    expect(state.lastNonConfigureMode).toBe("explore");
  });

  it("opens the panel for a hotspot and clears selection", () => {
    const store = useModeStore.getState();

    store.openPanelForHotspot("hs_1", "body");

    let state = useModeStore.getState();
    expect(state.mode).toBe("configure");
    expect(state.panelOpen).toBe(true);
    expect(state.activeRegionId).toBe("body");
    expect(state.activeHotspotId).toBe("hs_1");

    store.clearActiveRegion();
    state = useModeStore.getState();
    expect(state.activeRegionId).toBeNull();
    expect(state.activeHotspotId).toBeNull();
  });

  it("returns to the previous mode when closing the panel", () => {
    const store = useModeStore.getState();

    store.enterExplore();
    store.openPanel();

    expect(useModeStore.getState().mode).toBe("configure");

    store.closePanel();

    const state = useModeStore.getState();
    expect(state.mode).toBe("explore");
    expect(state.panelOpen).toBe(false);
  });
});
