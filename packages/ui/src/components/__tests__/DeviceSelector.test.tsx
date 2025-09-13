import React, { useState } from "react";
import {
  render,
  screen,
  fireEvent,
  configure,
  within,
} from "@testing-library/react";
import DeviceSelector from "../DeviceSelector";
import { getLegacyPreset, devicePresets } from "../../utils/devicePresets";

configure({ testIdAttribute: "data-testid" });

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

    const select = screen.getByLabelText("Device");
    const options = within(select).getAllByRole("option");
    expect(options).toHaveLength(devicePresets.length);
    devicePresets.forEach((p) => {
      expect(screen.getByRole("option", { name: p.label })).toBeInTheDocument();
    });

    (["desktop", "tablet", "mobile"] as const).forEach((t) => {
      const button = screen.getByRole("button", { name: t });
      expect(button).toHaveAttribute("aria-label", t);
      const srLabel = t.charAt(0).toUpperCase() + t.slice(1);
      expect(within(button).getByText(srLabel)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "tablet" }));
    expect(display).toHaveTextContent(getLegacyPreset("tablet").id);

    fireEvent.click(screen.getByRole("button", { name: "mobile" }));
    expect(display).toHaveTextContent(getLegacyPreset("mobile").id);

    fireEvent.click(screen.getByRole("button", { name: "desktop" }));
    expect(display).toHaveTextContent(getLegacyPreset("desktop").id);

    const newPreset = devicePresets.find((p) => p.id === "ipad-pro")!;
    fireEvent.change(select, { target: { value: newPreset.id } });
    expect(display).toHaveTextContent(newPreset.id);
  });

  it("invokes setDeviceId when presets are selected", () => {
    const setDeviceId = jest.fn();
    const initialId = getLegacyPreset("desktop").id;
    render(<DeviceSelector deviceId={initialId} setDeviceId={setDeviceId} />);

    fireEvent.click(screen.getByRole("button", { name: "tablet" }));
    expect(setDeviceId).toHaveBeenNthCalledWith(1, getLegacyPreset("tablet").id);
    fireEvent.click(screen.getByRole("button", { name: "mobile" }));
    expect(setDeviceId).toHaveBeenNthCalledWith(2, getLegacyPreset("mobile").id);
    fireEvent.click(screen.getByRole("button", { name: "desktop" }));
    expect(setDeviceId).toHaveBeenNthCalledWith(3, getLegacyPreset("desktop").id);

    const select = screen.getByLabelText("Device");
    const newPreset = devicePresets.find((p) => p.id === "ipad-pro")!;
    fireEvent.change(select, { target: { value: newPreset.id } });
    expect(setDeviceId).toHaveBeenNthCalledWith(4, newPreset.id);
  });

  it("applies active variant to current device", () => {
    render(<Wrapper />);

    const desktopBtn = screen.getByRole("button", { name: "desktop" });
    expect(desktopBtn).toHaveAttribute("variant", "default");

    fireEvent.click(screen.getByRole("button", { name: "tablet" }));

    expect(desktopBtn).toHaveAttribute("variant", "outline");
    const tabletBtn = screen.getByRole("button", { name: "tablet" });
    expect(tabletBtn).toHaveAttribute("variant", "default");
  });
});
