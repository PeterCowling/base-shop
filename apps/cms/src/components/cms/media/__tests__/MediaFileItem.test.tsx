import { render, fireEvent, waitFor } from "@testing-library/react";
import MediaFileItem from "../MediaFileItem";

describe("MediaFileItem", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  const item = { url: "http://example.com/video.mp4", type: "video" } as const;

  it("calls onDelete when Delete clicked", () => {
    const onDelete = jest.fn();
    const { getByText } = render(
      <MediaFileItem item={item} shop="shop" onDelete={onDelete} onReplace={jest.fn()} />
    );

    fireEvent.click(getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith(item.url);
  });

  it("does not call callbacks on failed replacement", async () => {
    const onDelete = jest.fn();
    const onReplace = jest.fn();
    global.fetch = jest.fn().mockRejectedValue(new Error("fail")) as any;

    const { getByText, getByPlaceholderText } = render(
      <MediaFileItem item={item} shop="shop" onDelete={onDelete} onReplace={onReplace} />
    );

    fireEvent.click(getByText("Edit"));
    fireEvent.change(getByPlaceholderText("Title"), { target: { value: "t" } });
    fireEvent.click(getByText("Save"));

    await waitFor(() => expect(onReplace).not.toHaveBeenCalled());
    expect(onDelete).not.toHaveBeenCalled();
  });
});
