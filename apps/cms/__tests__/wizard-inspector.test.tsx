import React, { useState } from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import { devicePresets } from "@acme/ui/utils/devicePresets";

import ThemeSelector from "../src/app/cms/shop/[shop]/themes/ThemeSelector";
import PreviewDeviceSelector from "../src/app/cms/wizard/PreviewDeviceSelector";
import WizardPreview from "../src/app/cms/wizard/WizardPreview";

jest.mock("@acme/design-system/atoms", () => ({
  Button: (props: any) => <button {...props} />,
}));

jest.mock("@acme/ui/components/common/DeviceSelector", () => {
  const React = require("react");
  const { devicePresets } = require("@acme/ui/utils/devicePresets");
  return {
    __esModule: true,
    default: ({ deviceId, onChange }: any) => (
      <select aria-label="Device" value={deviceId} onChange={(e) => onChange(e.target.value)}>
        {devicePresets.map((p: any) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
    ),
  };
});

jest.mock("../src/app/cms/wizard/WizardPreview", () => ({
  __esModule: true,
  default: ({ style, device }: any) => (
    <div
      data-cy="preview"
      style={{ ...style, width: `${device.width}px`, height: `${device.height}px` }}
    />
  ),
}));

function Inspector() {
  const [theme, setTheme] = useState("base");
  const [device, setDevice] = useState(devicePresets[0]);
  const style = (theme === "base" ? { "--color-bg": "white" } : { "--color-bg": "black" }) as React.CSSProperties;
  return (
    <>
      <ThemeSelector themes={["base", "dark"]} value={theme} onChange={(e) => setTheme(e.target.value)} />
      <PreviewDeviceSelector onChange={setDevice} showRotate />
      <WizardPreview style={style} device={device} />
    </>
  );
}

describe("Inspector theme and device selections", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("updates preview on selection and persists device", () => {
    const { unmount } = render(<Inspector />);

    const preview = screen.getByTestId("preview");
    expect(preview.style.width).toBe("1280px");
    expect(preview.style.height).toBe("800px");
    expect(preview.style.getPropertyValue("--color-bg")).toBe("white");

    fireEvent.change(screen.getByLabelText("Theme"), { target: { value: "dark" } });
    expect(preview.style.getPropertyValue("--color-bg")).toBe("black");

    fireEvent.change(screen.getByLabelText("Device"), { target: { value: "ipad" } });
    expect(preview.style.width).toBe("768px");
    expect(preview.style.height).toBe("1024px");

    fireEvent.click(screen.getByRole("button", { name: "Rotate" }));
    expect(preview.style.width).toBe("1024px");
    expect(preview.style.height).toBe("768px");

    fireEvent.change(screen.getByLabelText("Device"), { target: { value: devicePresets[0].id } });
    expect(preview.style.width).toBe("1280px");
    expect(preview.style.height).toBe("800px");

    fireEvent.change(screen.getByLabelText("Device"), { target: { value: "ipad" } });
    unmount();
    render(<Inspector />);
    const preview2 = screen.getByTestId("preview");
    expect(preview2.style.width).toBe("768px");
    expect(preview2.style.height).toBe("1024px");
  });
});
