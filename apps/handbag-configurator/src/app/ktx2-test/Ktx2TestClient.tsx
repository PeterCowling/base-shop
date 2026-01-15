"use client";

import { useEffect } from "react";
import { ViewerCanvas } from "../../viewer/ViewerCanvas";
import { useModeStore } from "../../viewer/state/modeStore";

const KTX2_MODEL_URL = "/ktx2-test/ktx2-test.gltf";

export function Ktx2TestClient() {
  const setMode = useModeStore((state) => state.setMode);

  useEffect(() => {
    setMode("showroom");
  }, [setMode]);

  return (
    <div className="handbag-shell flex min-h-dvh flex-col">
      <header className="border-b border-border-1 px-6 py-4">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">KTX2 Test</p>
        <h1 className="mt-2 text-3xl font-semibold">Basis Universal Texture</h1>
      </header>
      <div className="relative flex-1">
        <ViewerCanvas
          productId="bag-001"
          modelOverrideUrl={KTX2_MODEL_URL}
          hideTierControls
        />
        <div className="pointer-events-none absolute right-6 top-6 max-w-xs rounded-2xl border border-border-1 bg-panel/85 p-4 text-xs text-muted-foreground">
          Loads a minimal quad with a KTX2 baseColor texture via KHR_texture_basisu.
        </div>
      </div>
    </div>
  );
}
