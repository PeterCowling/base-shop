import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LiveChatWidget } from "../src/components/organisms/LiveChatWidget";

describe("LiveChatWidget", () => {
  it("applies numeric dimensions as inline styles", async () => {
    render(<LiveChatWidget width={300} bottomOffset={20} />);

    const toggle = screen.getByRole("button", { name: /chat/i });
    expect(toggle).toHaveStyle({ bottom: "20px" });

    await userEvent.click(toggle);
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveStyle({ width: "300px", bottom: "20px" });
  });

  it("uses class names for string dimensions", async () => {
    render(<LiveChatWidget width="w-96" bottomOffset="bottom-8" />);

    const toggle = screen.getByRole("button", { name: /chat/i });
    expect(toggle).toHaveClass("bottom-8");
    expect(toggle.style.bottom).toBe("");

    await userEvent.click(toggle);
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveClass("w-96", "bottom-8");
    expect(dialog.style.width).toBe("");
    expect(dialog.style.bottom).toBe("");
  });

  it("adds user and bot messages and ignores empty input", async () => {
    render(<LiveChatWidget />);

    await userEvent.click(screen.getByRole("button", { name: /chat/i }));

    const input = screen.getByPlaceholderText(/type a message/i);
    const send = screen.getByText("Send");

    await userEvent.click(send);
    expect(screen.queryByText(/thanks for your message/i)).not.toBeInTheDocument();

    await userEvent.type(input, "Hello");
    await userEvent.click(send);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText(/thanks for your message/i)).toBeInTheDocument();
    expect(screen.getAllByText(/(Hello|Thanks for your message!)/i)).toHaveLength(2);

    await userEvent.click(send);
    expect(screen.getAllByText(/(Hello|Thanks for your message!)/i)).toHaveLength(2);
  });
});

