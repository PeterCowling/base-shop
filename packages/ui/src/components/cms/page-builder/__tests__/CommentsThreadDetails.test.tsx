import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommentsThreadDetails from "../CommentsThreadDetails";

const baseThread = {
  id: "t1",
  componentId: "comp-1",
  resolved: false,
  assignedTo: null,
  messages: [
    { id: "m1", text: "hello @alice https://example.com", ts: new Date().toISOString() },
  ],
};

describe("CommentsThreadDetails", () => {
  it("handles resolve toggle, assign blur, mentions, jump, delete, and attach", async () => {
    const user = userEvent.setup();
    const onToggleResolved = jest.fn();
    const onAssign = jest.fn();
    const onAddMessage = jest.fn();
    const onDelete = jest.fn();
    const onJumpTo = jest.fn();

    // mock fetch for screenshot upload
    const fetchSpy = jest.spyOn(global, "fetch" as any).mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://img.example/s.png" }),
    } as any);

    render(
      <CommentsThreadDetails
        thread={baseThread as any}
        people={["alice", "bob", "ann"]}
        onToggleResolved={onToggleResolved}
        onAssign={onAssign}
        onAddMessage={onAddMessage}
        onDelete={onDelete}
        onJumpTo={onJumpTo}
        shop="shop-1"
      />
    );

    // Jump
    await user.click(screen.getByRole("button", { name: "Jump" }));
    expect(onJumpTo).toHaveBeenCalledWith("comp-1");

    // Resolve toggle
    const cb = screen.getByRole("checkbox", { name: "Resolved" });
    await user.click(cb);
    expect(onToggleResolved).toHaveBeenCalledWith("t1", true);

    // Assign blur triggers update
    const assign = screen.getByPlaceholderText("Assign to (name or email)");
    await user.clear(assign);
    await user.type(assign, "alice");
    fireEvent.blur(assign);
    expect(onAssign).toHaveBeenCalledWith("t1", "alice");

    // Mentions in composer
    const ta = screen.getByPlaceholderText(
      "Reply (type @ to mention, paste image to attach)"
    );
    await user.type(ta, "Hi @al");
    // menu opens; choose with Enter
    await user.keyboard("{Enter}");
    expect((ta as HTMLTextAreaElement).value).toContain("@alice");

    // Attach image via file input
    const attachBtn = screen.getByRole("button", { name: "Attach" });
    const input = attachBtn.parentElement!.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["fake"], "s.png", { type: "image/png" });
    // trigger change handler
    await waitFor(() => {
      Object.defineProperty(input, "files", { value: [file] });
      fireEvent.change(input);
    });
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    expect((ta as HTMLTextAreaElement).value).toContain("![screenshot](https://img.example/s.png)");

    // Send
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(onAddMessage).toHaveBeenCalled();

    // Delete respects confirm()
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith("t1");
    confirmSpy.mockRestore();
    fetchSpy.mockRestore();
  });
});
