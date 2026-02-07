import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PreviewClient from "./PreviewClient";

// Mock the preview device hook to use local state
jest.mock("@acme/ui/hooks", () => ({
  usePreviewDevice: (initial: string) => React.useState(initial),
}));

// Provide a small set of device presets
jest.mock("@acme/ui/utils/devicePresets", () => ({
  devicePresets: [
    { id: "a", label: "A", width: 100, height: 200 },
    { id: "b", label: "B", width: 300, height: 400 },
  ],
}));

// Stub DeviceSelector to switch to the second device when clicked
type DeviceSelectorProps = { setDeviceId: (id: string) => void };
const DeviceSelector = ({ setDeviceId }: DeviceSelectorProps) => (
  <button data-cy="select" onClick={() => setDeviceId("b")}>select</button>
);
jest.mock("@acme/ui/components/DeviceSelector", () => ({
  __esModule: true,
  default: (props: DeviceSelectorProps) => DeviceSelector(props),
}));

// Stub DynamicRenderer so we can detect render
jest.mock("@acme/ui/components/DynamicRenderer", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => <div data-cy="dynamic" {...props} />,
}));

describe("PreviewClient", () => {
  it("changes width and height when a different device is selected and renders DynamicRenderer", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <PreviewClient components={[]} locale="en" initialDeviceId="a" />,
    );

    const frame = container.querySelector(".mx-auto") as HTMLDivElement;
    expect(frame.style.width).toBe("100px");
    expect(frame.style.height).toBe("200px");
    expect(screen.getByTestId("dynamic")).toBeInTheDocument();

    await user.click(screen.getByTestId("select"));

    expect(frame.style.width).toBe("300px");
    expect(frame.style.height).toBe("400px");
  });
});
