import RichTextEditor from "@cms/app/cms/blog/posts/RichTextEditor";
import type { PortableTextBlock } from "@cms/app/cms/blog/posts/schema";
import { PortableTextEditor } from "@portabletext/editor";
import { fireEvent,render, screen } from "@testing-library/react";

const translations: Record<string, string> = {
  "cms.blog.editor.loadFailedProducts": "Failed to load products",
};
const translate = (key: string) => translations[key] ?? key;

jest.mock("@acme/design-system/atoms", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  Input: ({ label, ...props }: any) => (
    <label>
      <span>{label}</span>
      <input {...props} />
    </label>
  ),
}));
jest.mock("@acme/cms-ui/page-builder", () => ({
  ImagePicker: ({ children }: any) => <div>{children}</div>,
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt="" {...props} />
  ),
}));
jest.mock("@acme/i18n", () => ({
  useTranslations: () => translate,
}));
jest.mock("@acme/lib/format", () => ({
  formatCurrency: (value: number) => `$${value}`,
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
  afterEach(() => {
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

    const { unmount } = render(<RichTextEditor value={[]} onChange={jest.fn()} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "prod" } });

    expect(await screen.findByText("Product 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Product 1/ }));
    expect(PortableTextEditor.insertBlock).toHaveBeenCalledWith(
      expect.anything(),
      { name: "productReference" },
      { slug: "p1" }
    );

    unmount();
  });

  it("shows error when product search fails", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("fail"));

    const { unmount } = render(<RichTextEditor value={[]} onChange={jest.fn()} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "prod" } });

    expect(
      await screen.findByText("Failed to load products")
    ).toBeInTheDocument();

    unmount();
  });
});
