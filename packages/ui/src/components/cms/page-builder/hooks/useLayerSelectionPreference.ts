"use client";

import React from "react";

const KEY = "pb:layer-selection-parent-first";

export default function useLayerSelectionPreference() {
  const [parentFirst, setParentFirst] = React.useState<boolean>(() => {
    try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
  });
  React.useEffect(() => { try { localStorage.setItem(KEY, parentFirst ? "1" : "0"); } catch {} }, [parentFirst]);
  return { parentFirst, setParentFirst } as const;
}

