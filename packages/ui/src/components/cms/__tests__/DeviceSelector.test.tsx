import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeviceSelector from "../DeviceSelector";
import { devicePresets } from "../../../utils/devicePresets";

describe("DeviceSelector", () => {
  beforeAll(() => {
    // JSDOM doesn't implement these pointer APIs used by Radix Select
    // @ts-ignore
    HTMLElement.prototype.hasPointerCapture = () => false;
    // @ts-ignore
    HTMLElement.prototype.setPointerCapture = () => {};
    // @ts-ignore
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

  it("invokes toggleOrientation and rotates icon when landscape", async () => {
    const toggleOrientation = jest.fn();
    const { rerender } = render(
      <DeviceSelector
        deviceId="desktop-1280"
        orientation="portrait"
        setDeviceId={jest.fn()}
        toggleOrientation={toggleOrientation}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Rotate" }));
    expect(toggleOrientation).toHaveBeenCalled();

    rerender(
      <DeviceSelector
        deviceId="desktop-1280"
        orientation="landscape"
        setDeviceId={jest.fn()}
        toggleOrientation={toggleOrientation}
      />
    );

    const icon = screen
      .getByRole("button", { name: "Rotate" })
      .querySelector("svg");
    expect(icon).toHaveClass("rotate-90");
  });
});

