import { render, screen, fireEvent } from "@testing-library/react";
import PublishButton from "@cms/app/cms/blog/posts/PublishButton.client";

const mockPublish = jest.fn();

jest.mock("@cms/actions/blog.server", () => ({
  publishPost: (...args: any) => mockPublish(...args),
}));

const mockUseFormState = jest.fn((action: any, init: any) => [init, action]);
jest.mock("react-dom", () => ({
  useFormState: (...args: any[]) => mockUseFormState(...args),
}));

jest.mock("@ui", () => ({
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
