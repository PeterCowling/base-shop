import React from "react";
import { render, screen } from "@testing-library/react";

import DeviceSelector from "../src/components/DeviceSelector";
import { CUSTOM_DEVICES_KEY, devicePresets,getLegacyPreset } from "../src/utils/devicePresets";

jest.mock("../src/components/atoms/shadcn", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Select: ({ value, onValueChange, children }: any) => (
    <select value={value} onChange={(e) => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}));

describe("DeviceSelector with custom presets", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders options including custom presets from localStorage", () => {
    window.localStorage.setItem(
      CUSTOM_DEVICES_KEY,
      JSON.stringify([
        {
          id: "my-device",
          label: "My Device",
          width: 500,
          height: 800,
          type: "mobile",
          orientation: "landscape",
        },
      ])
    );

    const { container } = render(
      <DeviceSelector
        deviceId={getLegacyPreset("desktop").id}
        setDeviceId={() => {}}
      />
    );

    // Select contains "My Device" option
    const option = screen.getByRole("option", { name: "My Device" });
    expect(option).toBeInTheDocument();

    // options count equals stock presets + custom entries
    const options = Array.from(container.querySelectorAll("option"));
    expect(options.length).toBe(devicePresets.length + 1);
  });
});
