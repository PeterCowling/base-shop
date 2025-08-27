import { render, fireEvent, waitFor } from "@testing-library/react";
import MediaFileItem from "./MediaFileItem";

describe("MediaFileItem", () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn();
  });

  afterEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  const item = { url: "http://example.com/image.jpg", type: "image" } as const;

  it("calls onDelete when Delete clicked", () => {
    const onDelete = jest.fn();
    const { getByText } = render(
      <MediaFileItem item={item} shop="shop" onDelete={onDelete} onReplace={jest.fn()} />
    );

    fireEvent.click(getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith(item.url);
  });

  it("uploads replacement and calls callbacks", async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    const onReplace = jest.fn();
    (global.fetch as jest.Mock)
      // fetch existing file
      .mockResolvedValueOnce(new Response(new Blob(["file"], { type: "image/jpeg" })))
      // upload response
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ url: "http://example.com/new.jpg", type: "image" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

    const { getByText, getByPlaceholderText } = render(
      <MediaFileItem item={item} shop="shop" onDelete={onDelete} onReplace={onReplace} />
    );

    fireEvent.click(getByText("Edit"));
    fireEvent.change(getByPlaceholderText("Alt text"), { target: { value: "alt" } });
    fireEvent.click(getByText("Save"));

    await waitFor(() => expect(onReplace).toHaveBeenCalled());
    expect(onDelete).toHaveBeenCalledWith(item.url);
  });
});
