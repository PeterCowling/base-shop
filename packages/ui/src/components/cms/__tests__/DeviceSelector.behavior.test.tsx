import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import DeviceSelector from "../DeviceSelector";

function Wrapper({ onToggle }: { onToggle?: () => void }) {
  const [deviceId, setDeviceId] = useState("desktop-1280");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "landscape"
  );

  const handleSetDeviceId = (id: string) => {
    setDeviceId(id);
    setOrientation("portrait");
  };

  const toggleOrientation = () => {
    setOrientation((o) => (o === "portrait" ? "landscape" : "portrait"));
    onToggle?.();
  };

  return (
    <>
      <DeviceSelector
        deviceId={deviceId}
        orientation={orientation}
        setDeviceId={handleSetDeviceId}
        toggleOrientation={toggleOrientation}
      />
      <div data-cy="state">{`${deviceId}-${orientation}`}</div>
    </>
  );
}

describe("DeviceSelector behavior", () => {
  beforeAll(() => {
    // JSDOM doesn't implement these pointer APIs used by Radix Select
    // @ts-expect-error JSDOM lacks pointer capture APIs in tests
    HTMLElement.prototype.hasPointerCapture = () => false;
    // @ts-expect-error JSDOM lacks pointer capture APIs in tests
    HTMLElement.prototype.setPointerCapture = () => {};
    // @ts-expect-error JSDOM lacks scrollIntoView in tests
    Element.prototype.scrollIntoView = () => {};
  });

  it("updates active device and resets orientation", async () => {
    render(<Wrapper />);

    await userEvent.click(screen.getByLabelText("Device"));
    await userEvent.click(await screen.findByRole("option", { name: "iPad" }));

    expect(screen.getByTestId("state")).toHaveTextContent("ipad-portrait");
  });

  it("swaps orientation and calls callback", async () => {
    const onToggle = jest.fn();
    render(<Wrapper onToggle={onToggle} />);

    const button = screen.getByRole("button", { name: "Rotate" });
    await userEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("state")).toHaveTextContent(
      "desktop-1280-portrait"
    );

    await userEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("state")).toHaveTextContent(
      "desktop-1280-landscape"
    );
  });
});
