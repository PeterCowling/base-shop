import { render, screen, fireEvent } from "@testing-library/react";
import UnpublishButton from "@cms/app/cms/blog/posts/UnpublishButton.client";

const mockUnpublish = jest.fn();

jest.mock("@cms/actions/blog.server", () => ({
  unpublishPost: (...args: any) => mockUnpublish(...args),
}));

const mockUseFormState = jest.fn((action: any, init: any) => [init, action]);
jest.mock("react-dom", () => ({
  useFormState: (...args: any[]) => mockUseFormState(...args),
}));

jest.mock("@acme/ui", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Toast: ({ open, message }: any) => (open ? <div role="alert">{message}</div> : null),
}));

describe("UnpublishButton", () => {
  beforeEach(() => {
    mockUnpublish.mockReset();
  });

  it("calls unpublishPost on submit", () => {
    render(<UnpublishButton id="1" shopId="shop" />);
    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);
    expect(mockUnpublish).toHaveBeenCalledWith("shop", "1", expect.any(FormData));
  });
});
