import PublishButton from "@cms/app/cms/blog/posts/PublishButton.client";
import { fireEvent,render, screen } from "@testing-library/react";

const mockPublish = jest.fn();

jest.mock("@cms/actions/blog.server", () => ({
  publishPost: (...args: any) => mockPublish(...args),
}));

const mockUseFormState = jest.fn((action: any, init: any) => [init, action]);
jest.mock("react-dom", () => ({
  useFormState: (...args: [any, any]) => mockUseFormState(...args),
}));

jest.mock("@acme/ui", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Toast: ({ open, message }: any) => (open ? <div role="alert">{message}</div> : null),
}));

describe("PublishButton", () => {
  beforeEach(() => {
    mockPublish.mockReset();
  });

  it("calls publishPost on submit", () => {
    render(<PublishButton id="1" shopId="shop" />);
    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);
    expect(mockPublish).toHaveBeenCalledWith("shop", "1", expect.any(FormData));
  });
});
