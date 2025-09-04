import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DeviceSelector from "../DeviceSelector";
import { getLegacyPreset, devicePresets } from "../../utils/devicePresets";

jest.mock("../atoms/shadcn", () => {
  const React = require("react");
  return {
    Button: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
    Select: ({ value, onValueChange, children }: any) => (
      <select
        aria-label="Device"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      >
        {children}
      </select>
    ),
    SelectTrigger: ({ children }: any) => <>{children}</>,
    SelectValue: () => null,
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ children, value }: any) => (
      <option value={value}>{children}</option>
    ),
  };
});

function Wrapper() {
  const [deviceId, setDeviceId] = useState(getLegacyPreset("desktop").id);
  return (
    <>
      <span data-testid="device-id">{deviceId}</span>
      <DeviceSelector deviceId={deviceId} setDeviceId={setDeviceId} />
    </>
  );
}

describe("DeviceSelector", () => {
  it("updates deviceId via buttons and dropdown", () => {
    render(<Wrapper />);
    const display = screen.getByTestId("device-id");

    fireEvent.click(screen.getByRole("button", { name: "tablet" }));
    expect(display).toHaveTextContent(getLegacyPreset("tablet").id);

    fireEvent.click(screen.getByRole("button", { name: "mobile" }));
    expect(display).toHaveTextContent(getLegacyPreset("mobile").id);

    fireEvent.click(screen.getByRole("button", { name: "desktop" }));
    expect(display).toHaveTextContent(getLegacyPreset("desktop").id);

    const select = screen.getByLabelText("Device");
    const newPreset = devicePresets.find((p) => p.id === "ipad-pro")!;
    fireEvent.change(select, { target: { value: newPreset.id } });
    expect(display).toHaveTextContent(newPreset.id);
  });
});
