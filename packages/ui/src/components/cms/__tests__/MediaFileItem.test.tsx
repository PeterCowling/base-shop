import { render, fireEvent, waitFor } from "@testing-library/react";
import MediaFileItem from "../MediaFileItem";

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

  it("stops saving and stays in edit mode when upload fails", async () => {
    const onDelete = jest.fn();
    const onReplace = jest.fn();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(new Response(new Blob(["file"], { type: "image/jpeg" })))
      .mockRejectedValueOnce(new Error("upload failed"));

    const { getByText, getByPlaceholderText } = render(
      <MediaFileItem item={item} shop="shop" onDelete={onDelete} onReplace={onReplace} />
    );

    fireEvent.click(getByText("Edit"));
    fireEvent.change(getByPlaceholderText("Alt text"), { target: { value: "alt" } });
    fireEvent.click(getByText("Save"));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    expect(getByText("Save")).not.toBeDisabled();
    expect(getByText("Cancel")).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
    expect(onReplace).not.toHaveBeenCalled();
  });

  it("renders a video element when item type is video", () => {
    const videoItem = {
      url: "http://example.com/video.mp4",
      type: "video",
    } as const;

    const { container } = render(
      <MediaFileItem item={videoItem} shop="shop" onDelete={jest.fn()} onReplace={jest.fn()} />
    );

    expect(container.querySelector("video")).toBeInTheDocument();
  });

  it("displays alt text and tags when present", () => {
    const tagged = {
      url: "http://example.com/image.jpg",
      type: "image",
      altText: "an image",
      tags: ["foo", "bar"],
    } as const;

    const { getByText, queryByPlaceholderText } = render(
      <MediaFileItem item={tagged} shop="shop" onDelete={jest.fn()} onReplace={jest.fn()} />
    );

    expect(getByText("an image")).toBeInTheDocument();
    expect(getByText("foo, bar")).toBeInTheDocument();
    expect(queryByPlaceholderText("Alt text")).toBeNull();
  });
});
