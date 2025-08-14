import { render } from "@testing-library/react";
import RichTextEditor from "@cms/app/cms/blog/posts/RichTextEditor";
import type { PortableTextBlock } from "@cms/app/cms/blog/posts/schema";

jest.mock("@ui", () => ({
  Button: ({ children }: any) => <button>{children}</button>,
  Input: (props: any) => <input {...props} />,
  ImagePicker: ({ children }: any) => <div>{children}</div>,
}));
jest.mock("@portabletext/editor", () => ({
  defineSchema: (x: any) => x,
  EditorProvider: ({ children }: any) => <div>{children}</div>,
  PortableTextEditable: () => <div />,
  PortableTextEditor: {
    insertBlock: jest.fn(),
    toggleMark: jest.fn(),
    toggleBlockStyle: jest.fn(),
    addAnnotation: jest.fn(),
    removeAnnotation: jest.fn(),
    isAnnotationActive: jest.fn(),
  },
  useEditor: () => ({}),
}));

let captured: any;
jest.mock("@portabletext/editor/plugins", () => ({
  EventListenerPlugin: ({ on }: any) => {
    captured = on;
    return null;
  },
}));

describe("RichTextEditor", () => {
  it("invokes onChange on mutation", () => {
    const onChange = jest.fn();
    const initial: PortableTextBlock[] = [];
    render(<RichTextEditor value={initial} onChange={onChange} />);
    captured({ type: "mutation", value: [{ _type: "block", _key: "a" }] });
    expect(onChange).toHaveBeenCalledWith([{ _type: "block", _key: "a" }]);
  });
});
