import { render } from "@testing-library/react";
import React from "react";

jest.mock("../TextBlockView", () => jest.fn(() => <div />));
jest.mock("../useLocalizedTextEditor");
jest.mock("../useBlockTransform");

import TextBlockView from "../TextBlockView";
import useLocalizedTextEditor from "../useLocalizedTextEditor";
import useBlockTransform from "../useBlockTransform";
import TextBlock from "../TextBlock";

describe("TextBlock", () => {
  const textBlockViewMock = TextBlockView as unknown as jest.Mock;
  const useLocalizedTextEditorMock =
    useLocalizedTextEditor as unknown as jest.Mock;
  const useBlockTransformMock = useBlockTransform as unknown as jest.Mock;

  beforeEach(() => {
    textBlockViewMock.mockImplementation(() => <div />);
    useBlockTransformMock.mockReturnValue({
      startResize: jest.fn(),
      startDrag: jest.fn(),
      guides: { x: null, y: null },
      snapping: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("sanitizes dangerous HTML", () => {
    useLocalizedTextEditorMock.mockReturnValue({
      editor: null,
      editing: false,
      startEditing: jest.fn(),
      finishEditing: jest.fn(),
    });
    const html = '<img src="x" onerror="alert(1)"><script>alert(1)</script>';
    render(
      <TextBlock
        component={{ id: "1", type: "Text" as any, text: html }}
        index={0}
        parentId={undefined}
        selectedId={null}
        onSelectId={() => {}}
        onRemove={() => {}}
        dispatch={jest.fn()}
        locale="en"
        gridCols={12}
        viewport="desktop"
      />,
    );
    const content = textBlockViewMock.mock.calls[0][0].content as string;
    expect(content).not.toContain("<script>");
    expect(content).not.toContain("onerror");
  });

  it("dispatches localized HTML after editing", () => {
    const startEditing = jest.fn();
    const patch = { text: { en: "<p>updated</p>" } };
    const finishEditing = jest.fn().mockReturnValue(patch);
    useLocalizedTextEditorMock.mockReturnValue({
      editor: null,
      editing: false,
      startEditing,
      finishEditing,
    });
    const dispatch = jest.fn();
    render(
      <TextBlock
        component={{ id: "c1", type: "Text" as any }}
        index={0}
        parentId={undefined}
        selectedId={null}
        onSelectId={() => {}}
        onRemove={() => {}}
        dispatch={dispatch}
        locale="en"
        gridCols={12}
        viewport="desktop"
      />,
    );
    const props = textBlockViewMock.mock.calls[0][0];
    props.onStartEditing();
    expect(startEditing).toHaveBeenCalled();
    props.onFinishEditing();
    expect(finishEditing).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({
      type: "update",
      id: "c1",
      patch,
    });
  });

  it("applies style props and calls useBlockTransform when not editing", () => {
    useLocalizedTextEditorMock.mockReturnValue({
      editor: null,
      editing: false,
      startEditing: jest.fn(),
      finishEditing: jest.fn(),
    });
    render(
      <TextBlock
        component={{
          id: "c2",
          type: "Text" as any,
          width: "100px",
          height: "50px",
          margin: "10px",
          padding: "5px",
        }}
        index={0}
        parentId={undefined}
        selectedId={null}
        onSelectId={() => {}}
        onRemove={() => {}}
        dispatch={jest.fn()}
        locale="en"
        gridCols={12}
        viewport="desktop"
      />,
    );
    expect(useBlockTransformMock).toHaveBeenCalledWith(
      "c2",
      expect.objectContaining({ disabled: false }),
    );
    const style = textBlockViewMock.mock.calls[0][0].style as React.CSSProperties;
    expect(style).toMatchObject({
      width: "100px",
      height: "50px",
      margin: "10px",
      padding: "5px",
    });
  });
});

