import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { ScaffoldSpec } from "@acme/types/page/ScaffoldSpec";

import PreviewPane from "../src/app/cms/shop/[shop]/wizard/new/components/PreviewPane";

type PreviewRendererProps = {
  spec: ScaffoldSpec;
  deviceId?: string;
};

type DeviceSelectorProps = {
  deviceId: string;
  onChange: (id: string) => void;
  showLegacyButtons?: boolean;
};

let latestDeviceId: string | undefined;

const previewRendererMock = jest.fn((props: PreviewRendererProps) => {
  latestDeviceId = props.deviceId;
  return <div data-testid="preview-renderer" />;
});

jest.mock("@acme/cms-ui/page-builder/PreviewRenderer", () => ({
  __esModule: true,
  default: (props: PreviewRendererProps) => previewRendererMock(props),
}));

jest.mock("@acme/ui/components/common/DeviceSelector", () => ({
  __esModule: true,
  default: ({ deviceId, onChange }: DeviceSelectorProps) => (
    <button
      type="button"
      onClick={() => onChange(deviceId === "desktop" ? "mobile" : "desktop")}
    >
      Switch device
    </button>
  ),
}));

describe("PreviewPane", () => {
  beforeEach(() => {
    latestDeviceId = undefined;
    previewRendererMock.mockClear();
  });

  it("renders the preview and responds to device and action controls", async () => {
    const user = userEvent.setup();
    const spec: ScaffoldSpec = {
      layout: "default",
      sections: [],
    };
    const onBack = jest.fn();
    const onConfirm = jest.fn();

    render(<PreviewPane spec={spec} onBack={onBack} onConfirm={onConfirm} />);

    expect(previewRendererMock).toHaveBeenCalled();
    expect(latestDeviceId).toBe("desktop");

    await user.click(screen.getByRole("button", { name: /switch device/i }));

    await waitFor(() => {
      expect(latestDeviceId).toBe("mobile");
    });

    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
