import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LiveChatWidget } from "../LiveChatWidget";

describe("LiveChatWidget", () => {
  it("opens chat and sends messages", async () => {
    render(<LiveChatWidget />);

    expect(screen.queryByText(/how can we help/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /chat/i }));
    expect(await screen.findByText(/how can we help/i)).toBeInTheDocument();

    await userEvent.type(
      screen.getByPlaceholderText(/type a message/i),
      "Hello"
    );
    await userEvent.click(screen.getByText("Send"));

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText(/thanks for your message/i)).toBeInTheDocument();
  });
});
