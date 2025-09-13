import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("../TextBlock", () => jest.fn(() => <div data-cy="text-block" />));
jest.mock("../BlockItem", () => jest.fn(() => <div data-cy="block-item" />));

import TextBlock from "../TextBlock";
import BlockItem from "../BlockItem";
import CanvasItem from "../CanvasItem";

describe("CanvasItem", () => {
  const TextBlockMock = TextBlock as unknown as jest.Mock;
  const BlockItemMock = BlockItem as unknown as jest.Mock;

  afterEach(() => {
    jest.clearAllMocks();
  });

  const baseProps = {
    index: 0,
    parentId: undefined,
    selectedId: null,
    onSelectId: jest.fn(),
    onRemove: jest.fn(),
    dispatch: jest.fn(),
    locale: "en" as const,
    gridEnabled: false,
    gridCols: 12,
    viewport: "desktop" as const,
  };

  it("renders TextBlock when component type is Text", () => {
    const component = { id: "1", type: "Text" as const, text: "Hello" };
    render(<CanvasItem {...baseProps} component={component} />);
    expect(screen.getByTestId("text-block")).toBeInTheDocument();
    expect(TextBlockMock).toHaveBeenCalled();
    expect(TextBlockMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({ component })
    );
    expect(BlockItemMock).not.toHaveBeenCalled();
  });

  it("renders BlockItem when component type is not Text", () => {
    const component = { id: "2", type: "Image" as const };
    render(<CanvasItem {...baseProps} component={component as any} />);
    expect(screen.getByTestId("block-item")).toBeInTheDocument();
    expect(BlockItemMock).toHaveBeenCalled();
    expect(BlockItemMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({ component })
    );
    expect(TextBlockMock).not.toHaveBeenCalled();
  });
});
