import { render, screen, fireEvent } from "@testing-library/react";
import DeviceSelector from "../src/components/common/DeviceSelector";
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

describe("common DeviceSelector", () => {
  it("renders select only when legacy buttons hidden", () => {
    const onChange = jest.fn();
    render(
      <DeviceSelector
        deviceId={getLegacyPreset("desktop").id}
        onChange={onChange}
      />
    );
    expect(screen.queryByRole("button", { name: "desktop" })).toBeNull();
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: getLegacyPreset("mobile").id },
    });
    expect(onChange).toHaveBeenCalledWith(getLegacyPreset("mobile").id);
  });

  it("handles legacy buttons when enabled", () => {
    const onChange = jest.fn();
    render(
      <DeviceSelector
        deviceId={getLegacyPreset("desktop").id}
        onChange={onChange}
        showLegacyButtons
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "tablet" }));
    expect(onChange).toHaveBeenNthCalledWith(1, getLegacyPreset("tablet").id);

    fireEvent.click(screen.getByRole("button", { name: "mobile" }));
    expect(onChange).toHaveBeenNthCalledWith(2, getLegacyPreset("mobile").id);

    fireEvent.click(screen.getByRole("button", { name: "desktop" }));
    expect(onChange).toHaveBeenNthCalledWith(3, getLegacyPreset("desktop").id);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: getLegacyPreset("tablet").id },
    });
    expect(onChange).toHaveBeenNthCalledWith(4, getLegacyPreset("tablet").id);
  });
});

