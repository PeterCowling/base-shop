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
    await user.click(await screen.findByText("Delete"));

    expect(onDelete).toHaveBeenCalledWith(baseItem.url);
  });

  it("uploads a replacement file and forwards callbacks", async () => {
    jest.useFakeTimers();
    const onDelete = jest.fn().mockResolvedValue(undefined);
    const onReplace = jest.fn();
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

  it("calls onSelect when the overlay button is pressed", () => {
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

    fireEvent.click(screen.getByText("Open details"));
    expect(onSelect).toHaveBeenCalledWith(baseItem);
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

    fireEvent.click(screen.getByText("Select"));
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

  it("renders a deleting overlay and disables selection", () => {
    const onSelect = jest.fn();
    render(
      <MediaFileItem
        item={baseItem}
        shop="shop"
        onDelete={jest.fn()}
        onReplace={jest.fn()}
        onSelect={onSelect}
        deleting
      />
    );

    expect(screen.getByText(/deleting asset/i)).toBeInTheDocument();
    const selectButton = screen.getByText("Select");
    expect(selectButton).toBeDisabled();
    fireEvent.click(selectButton);
    expect(onSelect).not.toHaveBeenCalled();
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
});
