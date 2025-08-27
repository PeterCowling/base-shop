import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RichTextEditor from "@cms/app/cms/blog/posts/RichTextEditor";
import type { PortableTextBlock } from "@cms/app/cms/blog/posts/schema";
import { PortableTextEditor } from "@portabletext/editor";

jest.mock("@ui", () => ({
  Button: (props: any) => <button {...props} />,
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
  usePortableTextEditor: () => ({}),
}));

let captured: any;
jest.mock("@portabletext/editor/plugins", () => ({
  EventListenerPlugin: ({ on }: any) => {
    captured = on;
    return null;
  },
}));

describe("RichTextEditor", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("invokes onChange on mutation", () => {
    const onChange = jest.fn();
    const initial: PortableTextBlock[] = [];
    render(<RichTextEditor value={initial} onChange={onChange} />);
    captured({ type: "mutation", value: [{ _type: "block", _key: "a" }] });
    expect(onChange).toHaveBeenCalledWith([{ _type: "block", _key: "a" }]);
  });

  it("renders product matches and inserts reference block", async () => {
    jest
      .spyOn(global, "fetch")
      .mockResolvedValue({
        ok: true,
        json: async () => [
          {
            slug: "p1",
            title: "Product 1",
            price: 1000,
            media: [{ type: "image", url: "/i.png" }],
          },
        ],
      } as any);

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const { unmount } = render(<RichTextEditor value={[]} onChange={jest.fn()} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "prod");

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await act(async () => {});

    expect(screen.getByText("Product 1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Product 1/ }));
    expect(PortableTextEditor.insertBlock).toHaveBeenCalledWith(
      expect.anything(),
      { name: "productReference" },
      { slug: "p1" }
    );

    unmount();
    act(() => {
      jest.runOnlyPendingTimers();
    });
  });

  it("shows error when product search fails", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("fail"));

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const { unmount } = render(<RichTextEditor value={[]} onChange={jest.fn()} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "prod");

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await act(async () => {});

    expect(
      screen.getByText("Failed to load products")
    ).toBeInTheDocument();

    unmount();
    act(() => {
      jest.runOnlyPendingTimers();
    });
  });
});
