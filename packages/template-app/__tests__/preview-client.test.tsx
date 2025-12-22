/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import PreviewClient from "../src/app/preview/[pageId]/PreviewClient";

jest.mock("@/components/DynamicRenderer", () => ({
  __esModule: true,
  default: (props: any) => <div data-cy="renderer" {...props} />,
}));

jest.mock("@ui/components/DeviceSelector", () => ({
  __esModule: true,
  default: () => <div data-cy="selector" />,
}));

jest.mock("@ui/utils/devicePresets", () => ({
  devicePresets: [
    { id: "phone", width: 10, height: 20 },
    { id: "tablet", width: 30, height: 40 },
  ],
}));

jest.mock("@ui/hooks/usePreviewDevice", () => ({
  usePreviewDevice: () => ["phone", jest.fn()],
}));

describe("PreviewClient", () => {
  it("renders device selector and dynamic renderer", () => {
    render(
      <PreviewClient
        components={[{ id: "1", type: "Text" } as any]}
        locale="en"
        initialDeviceId="phone"
      />,
    );
    expect(screen.getByTestId("selector")).toBeInTheDocument();
    expect(screen.getByTestId("renderer")).toBeInTheDocument();
    const container = screen.getByTestId("renderer").parentElement;
    expect(container).toHaveStyle({ width: "10px", height: "20px" });
  });
});
