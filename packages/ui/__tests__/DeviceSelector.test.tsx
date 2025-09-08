import { render, screen, fireEvent } from "@testing-library/react";
import DeviceSelector from "../src/components/DeviceSelector";
import { getLegacyPreset } from "../src/utils/devicePresets";

jest.mock("../src/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    Button: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
    Select: ({ value, onValueChange, children }: any) => (
      <select value={value} onChange={(e) => onValueChange(e.target.value)}>
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

describe("DeviceSelector", () => {
  it("calls setDeviceId with correct device values", () => {
    const setDeviceId = jest.fn();
    const currentId = getLegacyPreset("desktop").id;
    render(<DeviceSelector deviceId={currentId} setDeviceId={setDeviceId} />);

    fireEvent.click(screen.getByRole("button", { name: "tablet" }));
    expect(setDeviceId).toHaveBeenNthCalledWith(1, getLegacyPreset("tablet").id);

    fireEvent.click(screen.getByRole("button", { name: "mobile" }));
    expect(setDeviceId).toHaveBeenNthCalledWith(2, getLegacyPreset("mobile").id);

    fireEvent.click(screen.getByRole("button", { name: "desktop" }));
    expect(setDeviceId).toHaveBeenNthCalledWith(3, getLegacyPreset("desktop").id);
  });
});

