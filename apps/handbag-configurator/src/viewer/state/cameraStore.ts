import type { Vector3 } from "three";
import { create } from "zustand";

type CameraFocusState = {
  focusPoint: Vector3 | null;
  focusDistance: number | null;
  setFocusPoint: (point: Vector3, distance?: number) => void;
  clearFocus: () => void;
};

export const useCameraFocusStore = create<CameraFocusState>((set) => ({
  focusPoint: null,
  focusDistance: null,
  setFocusPoint: (point, distance) =>
    set({
      focusPoint: point.clone(),
      focusDistance: distance ?? null,
    }),
  clearFocus: () => set({ focusPoint: null, focusDistance: null }),
}));

