import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeviceSelector from "../DeviceSelector";

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

