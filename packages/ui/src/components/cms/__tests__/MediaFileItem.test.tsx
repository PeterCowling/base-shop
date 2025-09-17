import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MediaFileItem from "../MediaFileItem";

describe("MediaFileItem", () => {
  const baseItem = {
    url: "http://example.com/image.jpg",
    type: "image" as const,
    altText: "Alt text",
    tags: ["featured", "homepage"],
    size: 12_288,
  };

  beforeEach(() => {
    // @ts-expect-error — tests control fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it("calls onDelete when the dropdown action is selected", async () => {
    const onDelete = jest.fn();
    const user = userEvent.setup();
    render(
      <MediaFileItem
        item={baseItem}
        shop="shop"
        onDelete={onDelete}
        onReplace={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /media actions/i }));
    await user.click(
      await screen.findByRole("menuitem", { name: /delete media/i })
    );

    expect(onDelete).toHaveBeenCalledWith(baseItem.url);
  });

  it("uploads a replacement file and forwards callbacks", async () => {
    jest.useFakeTimers();
    const onDelete = jest.fn().mockResolvedValue(undefined);
    const onReplace = jest.fn();
    const onReplaceSuccess = jest.fn();
    const onReplaceError = jest.fn();
    const replacement = { url: "http://example.com/new.jpg", type: "image" };
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify(replacement), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { container } = render(
      <MediaFileItem
        item={baseItem}
        shop="shop"
        onDelete={onDelete}
        onReplace={onReplace}
        onReplaceSuccess={onReplaceSuccess}
        onReplaceError={onReplaceError}
      />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["hello"], "hello.png", { type: "image/png" });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => expect(onReplace).toHaveBeenCalled());
    expect(onReplace).toHaveBeenCalledWith(baseItem.url, replacement);
    expect(onDelete).toHaveBeenCalledWith(baseItem.url);
    expect(onReplaceSuccess).toHaveBeenCalledWith(replacement);
    expect(onReplaceError).not.toHaveBeenCalled();

    act(() => {
      jest.runAllTimers();
    });
    jest.useRealTimers();
  });

  it("reports errors when a replacement fails", async () => {
    jest.useFakeTimers();
    const onDelete = jest.fn();
    const onReplace = jest.fn();
    const onReplaceSuccess = jest.fn();
    const onReplaceError = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ error: "nope" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { container } = render(
      <MediaFileItem
        item={baseItem}
        shop="shop"
        onDelete={onDelete}
        onReplace={onReplace}
        onReplaceSuccess={onReplaceSuccess}
        onReplaceError={onReplaceError}
      />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["hello"], "hello.png", { type: "image/png" });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() =>
      expect(onReplaceError).toHaveBeenCalledWith("Failed to upload replacement")
    );
    expect(onReplaceSuccess).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
    expect(onReplace).not.toHaveBeenCalled();

    act(() => {
      jest.runAllTimers();
    });
    jest.useRealTimers();
  });

  it("renders multi-select controls and notifies when toggled", () => {
    const onBulkToggle = jest.fn();
    render(
      <MediaFileItem
        item={baseItem}
        shop="shop"
        onDelete={jest.fn()}
        onReplace={jest.fn()}
        selectionEnabled
        selected={false}
        onBulkToggle={onBulkToggle}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(onBulkToggle).toHaveBeenCalledWith(baseItem, true);
  });

  it("calls onOpenDetails when the overlay button is pressed", () => {
    const onOpenDetails = jest.fn();
    render(
      <MediaFileItem
        item={baseItem}
        shop="shop"
        onDelete={jest.fn()}
        onReplace={jest.fn()}
        onOpenDetails={onOpenDetails}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /open details/i }));
    expect(onOpenDetails).toHaveBeenCalledWith(baseItem);
  });

  it("exposes a select button when onSelect is provided", () => {
    const onSelect = jest.fn();
    render(
      <MediaFileItem
        item={baseItem}
        shop="shop"
        onDelete={jest.fn()}
        onReplace={jest.fn()}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /select media/i }));
    expect(onSelect).toHaveBeenCalledWith(baseItem);
  });

  it("shows external replacement progress", () => {
    const replacingItem = {
      ...baseItem,
      status: "replacing",
      replaceProgress: 45,
    };
    render(
      <MediaFileItem
        item={replacingItem}
        shop="shop"
        onDelete={jest.fn()}
        onReplace={jest.fn()}
      />
    );

    expect(screen.getByText(/replacing asset/i)).toBeInTheDocument();
    expect(screen.getByText("45%"))
      .toBeInTheDocument();
  });

  it("renders tags and file size badges", () => {
    render(
      <MediaFileItem
        item={baseItem}
        shop="shop"
        onDelete={jest.fn()}
        onReplace={jest.fn()}
      />
    );

    expect(screen.getByText("featured")).toBeInTheDocument();
    expect(screen.getByText("homepage")).toBeInTheDocument();
    expect(screen.getByText(/12 KB/)).toBeInTheDocument();
  });

  it("disables actions and shows a spinner when deleting", () => {
    render(
      <MediaFileItem
        item={baseItem}
        shop="shop"
        onDelete={jest.fn()}
        onReplace={jest.fn()}
        onOpenDetails={jest.fn()}
        onSelect={jest.fn()}
        deleting
      />
    );

    expect(screen.getByRole("button", { name: /media actions/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /open details/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /select media/i })).toBeDisabled();
    expect(screen.getAllByText("Deleting media")).not.toHaveLength(0);
  });

  it("disables actions and shows replacement feedback when replacing", () => {
    render(
      <MediaFileItem
        item={baseItem}
        shop="shop"
        onDelete={jest.fn()}
        onReplace={jest.fn()}
        onOpenDetails={jest.fn()}
        onSelect={jest.fn()}
        replacing
      />
    );

    expect(screen.getByRole("button", { name: /media actions/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /open details/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /select media/i })).toBeDisabled();
    expect(screen.getAllByText("Replacing media")).not.toHaveLength(0);
  });
});
