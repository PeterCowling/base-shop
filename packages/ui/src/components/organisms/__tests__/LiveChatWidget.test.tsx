/* i18n-exempt file -- tests rely on literal chat copy */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LiveChatWidget } from "../LiveChatWidget";

describe("LiveChatWidget", () => {
  it("sends messages, auto-replies, and resets the input", async () => {
    const user = userEvent.setup();
    render(<LiveChatWidget bottomOffset={24} width={360} />);

    const trigger = screen.getByRole("button", { name: /live chat/i });
    expect(trigger).toHaveStyle({ bottom: "24px" });

    await user.click(trigger);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveStyle({ bottom: "24px" });

    const input = await screen.findByPlaceholderText("Type a message…");

    await user.type(input, "   ");
    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(screen.queryByText("Thanks for your message!")).not.toBeInTheDocument();

    await user.type(input, "Hello there");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText("Hello there")).toBeInTheDocument();
    expect(await screen.findByText("Thanks for your message!")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("applies Tailwind bottom offsets when provided as a class", async () => {
    const user = userEvent.setup();
    render(<LiveChatWidget bottomOffset="bottom-10" className="custom" />);

    const trigger = screen.getByRole("button", { name: /live chat/i });
    expect(trigger.className).toContain("bottom-10");
    expect(trigger.className).toContain("custom");

    await user.click(trigger);

    const dialog = await screen.findByRole("dialog");
    expect(dialog.className).toContain("bottom-10");
  });
});
