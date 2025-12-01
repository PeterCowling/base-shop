/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import PreviewClient from "../src/app/preview/[pageId]/PreviewClient";

jest.mock("@/components/DynamicRenderer", () => ({
  __esModule: true,
  default: (props: any) => <div data-cy="renderer" {...props} />,
}));

jest.mock("@ui", () => ({
  __esModule: true,
  DeviceSelector: () => <div data-cy="selector" />,
  devicePresets: [
    { id: "phone", width: 10, height: 20 },
    { id: "tablet", width: 30, height: 40 },
  ],
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
