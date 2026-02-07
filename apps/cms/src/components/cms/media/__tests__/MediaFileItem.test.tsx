import { render, screen,waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MediaFileItem from "../MediaFileItem";

describe("MediaFileItem", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  const item = { url: "http://example.com/video.mp4", type: "video" } as const;

  it("calls onDelete when Delete clicked", async () => {
    const onDelete = jest.fn();
    render(
      <MediaFileItem item={item} shop="shop" onDelete={onDelete} onReplace={jest.fn()} />
    );

    const user = userEvent.setup();
    await user.click(screen.getByLabelText("Media actions"));
    const deleteAction = await screen.findByRole("menuitem", { name: "Delete media" });
    await user.click(deleteAction);

    expect(onDelete).toHaveBeenCalledWith(item.url);
  });

  it("does not call callbacks on failed replacement", async () => {
    const onDelete = jest.fn();
    const onReplace = jest.fn();
    global.fetch = jest.fn().mockRejectedValue(new Error("fail")) as any;

    const { container } = render(
      <MediaFileItem item={item} shop="shop" onDelete={onDelete} onReplace={onReplace} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["content"], "replacement.png", { type: "image/png" });

    const user = userEvent.setup();
    await user.upload(input, file);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    await waitFor(() => expect(onReplace).not.toHaveBeenCalled());
    expect(onDelete).not.toHaveBeenCalled();
  });
});
