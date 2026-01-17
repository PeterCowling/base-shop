import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import PostForm from "@cms/app/cms/blog/posts/PostForm.client";

jest.mock("react-dom", () => ({
  useFormState: (_action: any, init: any) => [init, jest.fn()],
}));

jest.mock("@acme/ui", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Input: ({ label, error, ...props }: any) => (
    <div>
      <input aria-label={label} {...props} />
      {error && <span>{error}</span>}
    </div>
  ),
  Switch: ({ onChange, ...props }: any) => (
    <input type="checkbox" onChange={onChange} {...props} />
  ),
  Textarea: ({ label, ...props }: any) => <textarea aria-label={label} {...props} />,
  Toast: ({ open, message }: any) => (open ? <div role="alert">{message}</div> : null),
}));

jest.mock("@cms/app/cms/blog/posts/MainImageField", () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock("@cms/app/cms/blog/posts/RichTextEditor", () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock("@cms/app/cms/blog/posts/invalidProductContext", () => ({
  InvalidProductProvider: ({ children }: any) => <div>{children}</div>,
  useInvalidProductContext: () => ({ invalidProducts: {} }),
}));

jest.mock("@portabletext/react", () => ({ PortableText: () => <div /> }));
jest.mock("@cms/app/cms/blog/posts/schema", () => ({ previewComponents: {} }));

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("shopId=shop1"),
}));

describe("PostForm", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock) = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    (global.fetch as jest.Mock).mockReset();
  });

  it("slugifies title and shows error when slug exists", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ exists: true }),
    });

    render(<PostForm action={async () => ({})} submitLabel="Save" />);

    fireEvent.change(screen.getByLabelText(/Title/), {
      target: { value: "My Post" },
    });

    expect(screen.getByLabelText(/Slug/)).toHaveValue("my-post");

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    expect(await screen.findByText(/Slug already exists/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
