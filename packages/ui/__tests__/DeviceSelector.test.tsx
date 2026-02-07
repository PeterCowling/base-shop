import React from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import DeviceSelector from "../src/components/DeviceSelector";
import { getLegacyPreset } from "../src/utils/devicePresets";

// Mock shadcn primitives to simple HTML controls
jest.mock("../src/components/atoms/shadcn", () => {
  return {
    Button: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
    // Render a native <select> and pass through children.
    // With SelectTrigger mocked to null, only <option> elements remain
    // (wrapped by a Fragment from SelectContent), which is valid.
    Select: ({ value, onValueChange, children }: any) => (
      <select
        aria-label="Device"
        value={value}
        onChange={(e) => onValueChange((e.target as HTMLSelectElement).value)}
      >
        {children}
      </select>
    ),
    // In Radix, Trigger is a button; for the native-select mock we omit it
    // entirely to avoid placing a <div> within <select>.
    SelectTrigger: () => null,
    SelectValue: () => null,
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ children, value }: any) => (
      <option value={value}>{children}</option>
    ),
  };
});

describe("DeviceSelector", () => {
  it("clicks legacy buttons to select presets", () => {
    const onChange = jest.fn();
    render(
      <DeviceSelector
        deviceId={getLegacyPreset("desktop").id}
        setDeviceId={onChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /tablet/i }));
    expect(onChange).toHaveBeenCalledWith(getLegacyPreset("tablet").id);
    fireEvent.click(screen.getByRole("button", { name: /mobile/i }));
    expect(onChange).toHaveBeenCalledWith(getLegacyPreset("mobile").id);
    fireEvent.click(screen.getByRole("button", { name: /desktop/i }));
    expect(onChange).toHaveBeenCalledWith(getLegacyPreset("desktop").id);
  });

  it("changes select to a specific preset id", () => {
    const onChange = jest.fn();
    render(
      <DeviceSelector
        deviceId={getLegacyPreset("desktop").id}
        setDeviceId={onChange}
      />
    );

    const select = screen.getByRole("combobox");
    expect((select as HTMLSelectElement).value).toBe(getLegacyPreset("desktop").id);
    fireEvent.change(select, { target: { value: getLegacyPreset("mobile").id } });
    expect(onChange).toHaveBeenCalledWith(getLegacyPreset("mobile").id);
  });
});
