import React from "react";
import { render, screen } from "@testing-library/react";
import DeviceSelector from "../DeviceSelector";
import { getLegacyPreset } from "../../../utils/devicePresets";

describe("DeviceSelector", () => {
  it("renders legacy icon buttons with correct sizing and icon visibility", () => {
    render(
      <DeviceSelector
        deviceId={getLegacyPreset("desktop").id}
        onChange={jest.fn()}
        showLegacyButtons
        compact={false}
        extraDevices={[]}
      />
    );

    const names = ["desktop", "tablet", "mobile"] as const;
    for (const name of names) {
      const btn = screen.getByLabelText((content) => content.trim().toLowerCase() === name);
      expect(btn.className).toContain("w-12");
      expect(btn.className).toContain("h-10");
      expect(btn.className).toContain("min-w-12");
      const svg = btn.querySelector("svg");
      expect(svg?.classList.contains("h-4")).toBe(true);
      expect(svg?.classList.contains("w-4")).toBe(true);
    }
  });
});
