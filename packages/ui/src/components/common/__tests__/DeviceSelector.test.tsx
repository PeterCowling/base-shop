import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DeviceSelector from "../DeviceSelector";
import { devicePresets, getLegacyPreset } from "../../../utils/devicePresets";

jest.mock("../../atoms/shadcn", () => {
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

describe("common/DeviceSelector", () => {
  it("renders only the Select when showLegacyButtons is false and handles change", () => {
    const onChange = jest.fn();
    const initial = getLegacyPreset("desktop").id;
    render(<DeviceSelector deviceId={initial} onChange={onChange} />);

    const select = screen.getByLabelText("Device");
    expect(select).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);

    const newPreset = devicePresets.find((p) => p.id !== initial)!;
    fireEvent.change(select, { target: { value: newPreset.id } });
    expect(onChange).toHaveBeenCalledWith(newPreset.id);
  });

  it("renders legacy buttons, invokes onChange, and updates active variant", () => {
    const onChange = jest.fn();

    function Wrapper() {
      const [deviceId, setDeviceId] = useState(getLegacyPreset("desktop").id);
      const handleChange = (id: string) => {
        onChange(id);
        setDeviceId(id);
      };
      return (
        <DeviceSelector
          deviceId={deviceId}
          onChange={handleChange}
          showLegacyButtons
        />
      );
    }

    render(<Wrapper />);

    (["desktop", "tablet", "mobile"] as const).forEach((t) => {
      expect(screen.getByRole("button", { name: t })).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "desktop" })).toHaveAttribute(
      "variant",
      "default",
    );

    fireEvent.click(screen.getByRole("button", { name: "tablet" }));
    expect(onChange).toHaveBeenNthCalledWith(1, getLegacyPreset("tablet").id);
    expect(screen.getByRole("button", { name: "tablet" })).toHaveAttribute(
      "variant",
      "default",
    );
    expect(screen.getByRole("button", { name: "desktop" })).toHaveAttribute(
      "variant",
      "outline",
    );

    fireEvent.click(screen.getByRole("button", { name: "mobile" }));
    expect(onChange).toHaveBeenNthCalledWith(2, getLegacyPreset("mobile").id);
    expect(screen.getByRole("button", { name: "mobile" })).toHaveAttribute(
      "variant",
      "default",
    );
    expect(screen.getByRole("button", { name: "tablet" })).toHaveAttribute(
      "variant",
      "outline",
    );

    fireEvent.click(screen.getByRole("button", { name: "desktop" }));
    expect(onChange).toHaveBeenNthCalledWith(3, getLegacyPreset("desktop").id);
    expect(screen.getByRole("button", { name: "desktop" })).toHaveAttribute(
      "variant",
      "default",
    );
    expect(screen.getByRole("button", { name: "mobile" })).toHaveAttribute(
      "variant",
      "outline",
    );
  });
});

