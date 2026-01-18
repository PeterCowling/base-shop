import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeviceSelector from "../DeviceSelector";
import { devicePresets } from "../../../utils/devicePresets";
import { useState } from "react";

describe("DeviceSelector", () => {
  beforeAll(() => {
    // JSDOM doesn't implement these pointer APIs used by Radix Select
    HTMLElement.prototype.hasPointerCapture = () => false;
    HTMLElement.prototype.setPointerCapture = () => {};
    Element.prototype.scrollIntoView = () => {};
  });
  it("lists all device presets in the dropdown", async () => {
    render(
      <DeviceSelector
        deviceId={devicePresets[0].id}
        orientation="portrait"
        setDeviceId={jest.fn()}
        toggleOrientation={jest.fn()}
      />
    );

    await userEvent.click(screen.getByLabelText("Device"));
    const options = await screen.findAllByRole("option");
    const labels = options.map((o) => o.textContent);
    expect(labels).toEqual(devicePresets.map((p) => p.label));
  });

  it("calls setDeviceId for each preset option", async () => {
    for (const preset of devicePresets) {
      const initialId =
        preset.id === devicePresets[0].id
          ? devicePresets[1].id
          : devicePresets[0].id;
      const setDeviceId = jest.fn();
      const { unmount } = render(
        <DeviceSelector
          deviceId={initialId}
          orientation="portrait"
          setDeviceId={setDeviceId}
          toggleOrientation={jest.fn()}
        />
      );

      await userEvent.click(screen.getByLabelText("Device"));
      await userEvent.click(
        await screen.findByRole("option", { name: preset.label })
      );

      expect(setDeviceId).toHaveBeenCalledWith(preset.id);
      unmount();
    }
  });
  it("calls setDeviceId when a new device is selected", async () => {
    const setDeviceId = jest.fn();
    render(
      <DeviceSelector
        deviceId="desktop-1280"
        orientation="portrait"
        setDeviceId={setDeviceId}
        toggleOrientation={jest.fn()}
      />
    );

    await userEvent.click(screen.getByLabelText("Device"));
    await userEvent.click(await screen.findByRole("option", { name: "iPad" }));

    expect(setDeviceId).toHaveBeenCalledWith("ipad");
  });

  it("does not rotate icon when orientation is portrait", () => {
    render(
      <DeviceSelector
        deviceId="desktop-1280"
        orientation="portrait"
        setDeviceId={jest.fn()}
        toggleOrientation={jest.fn()}
      />
    );

    const icon = screen
      .getByRole("button", { name: "Rotate" })
      .querySelector("svg");
    expect(icon).not.toHaveClass("rotate-90");
  });

  it("toggles icon rotation immediately when button is clicked", async () => {
    const toggleOrientation = jest.fn();
    function Wrapper() {
      const [orientation, setOrientation] = useState<
        "portrait" | "landscape"
      >("portrait");
      const handleToggle = () => {
        setOrientation((o) => (o === "portrait" ? "landscape" : "portrait"));
        toggleOrientation();
      };
      return (
        <DeviceSelector
          deviceId="desktop-1280"
          orientation={orientation}
          setDeviceId={jest.fn()}
          toggleOrientation={handleToggle}
        />
      );
    }

    render(<Wrapper />);

    const button = screen.getByRole("button", { name: "Rotate" });
    const icon = button.querySelector("svg");
    expect(icon).not.toHaveClass("rotate-90");

    await userEvent.click(button);
    expect(toggleOrientation).toHaveBeenCalledTimes(1);
    expect(icon).toHaveClass("rotate-90");

    await userEvent.click(button);
    expect(toggleOrientation).toHaveBeenCalledTimes(2);
    expect(icon).not.toHaveClass("rotate-90");
  });
});
