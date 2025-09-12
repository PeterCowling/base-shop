import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LiveChatWidget } from "./LiveChatWidget";

describe("LiveChatWidget", () => {
  it("opens chat and applies numeric dimensions", async () => {
    render(<LiveChatWidget width={300} bottomOffset={20} />);

    const toggle = screen.getByRole("button", { name: /chat/i });
    expect(toggle).toHaveStyle({ bottom: "20px" });

    await userEvent.click(toggle);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveStyle({ width: "300px", bottom: "20px" });

    await userEvent.type(
      screen.getByPlaceholderText(/type a message/i),
      "Hello"
    );
    await userEvent.click(screen.getByText("Send"));

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText(/thanks for your message/i)).toBeInTheDocument();
  });

  it("ignores whitespace-only messages", async () => {
    render(<LiveChatWidget />);

    await userEvent.click(screen.getByRole("button", { name: /chat/i }));

    await userEvent.type(screen.getByPlaceholderText(/type a message/i), "   ");
    await userEvent.click(screen.getByText("Send"));

    expect(
      screen.queryByText(/thanks for your message/i)
    ).not.toBeInTheDocument();
  });
});
