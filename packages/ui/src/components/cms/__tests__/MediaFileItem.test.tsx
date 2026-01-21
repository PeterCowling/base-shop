import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MediaFileItem from "../MediaFileItem";

import { baseImageItem as baseItem, createDeferred, makeFile, mockFetchJson, setupMedia } from "./testUtils";

describe("MediaFileItem", () => {

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it("calls onDelete when the dropdown action is selected", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    setupMedia({ item: baseItem, onDelete, onReplace: jest.fn() });

    await user.click(screen.getByRole("button", { name: /media actions/i }));
    await user.click(await screen.findByText("Delete"));

    expect(onDelete).toHaveBeenCalledWith(baseItem.url);
  });
  it("provides accessible controls for the media actions dropdown", async () => {
    const user = userEvent.setup();
    setupMedia({ item: baseItem, onDelete: jest.fn(), onReplace: jest.fn(), onSelect: jest.fn() });

    const trigger = screen.getByRole("button", { name: /media actions/i });
    expect(trigger).not.toHaveAttribute("aria-expanded", "true");

    await user.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));

    const pointerMenu = await screen.findByRole("menu");
    const pointerItems = within(pointerMenu).getAllByRole("menuitem");
    expect(pointerItems).toHaveLength(3);
    expect(within(pointerMenu).getByRole("menuitem", { name: /view details/i })).toBeInTheDocument();
    expect(within(pointerMenu).getByRole("menuitem", { name: /replace/i })).toBeInTheDocument();
    expect(within(pointerMenu).getByRole("menuitem", { name: /delete/i })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    trigger.focus();
    expect(trigger).toHaveFocus();

    await user.keyboard("{Enter}");
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));

    const keyboardMenu = await screen.findByRole("menu");
    const keyboardItems = within(keyboardMenu).getAllByRole("menuitem");
    await waitFor(() => expect(keyboardItems[0]).toHaveFocus());

    await user.keyboard("{ArrowDown}");
    expect(keyboardItems[1]).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(keyboardItems[2]).toHaveFocus();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));

    trigger.focus();
    expect(trigger).toHaveFocus();
    await user.keyboard("{Space}");
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
    expect(await screen.findByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
  });
  it("uploads a replacement file and forwards callbacks", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onReplaceSuccess = jest.fn();
    const onReplaceError = jest.fn();
    const replacement = { url: "http://example.com/new.jpg", type: "image" } as const;
    mockFetchJson(replacement, 200);

    const { fileInput, onDelete, onReplace } = setupMedia({
      item: baseItem,
      onDelete: jest.fn().mockResolvedValue(undefined),
      onReplace: jest.fn(),
      onReplaceSuccess,
      onReplaceError,
    });

    await user.upload(fileInput, makeFile());

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
  it("shows upload progress while replacing media", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const deferred = createDeferred<Response>();
    const replacement = { url: "http://example.com/new.jpg", type: "image" };
    (global.fetch as jest.Mock).mockReturnValue(deferred.promise);

    const { fileInput } = setupMedia({ item: baseItem, onReplaceSuccess: jest.fn() });

    await user.upload(fileInput, makeFile());

    expect(await screen.findByText("4%")).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(await screen.findByText("10%")).toBeInTheDocument();

    await act(async () => {
      deferred.resolve(
        new Response(JSON.stringify(replacement), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    expect(await screen.findByText("100%")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(400);
    });

    await waitFor(() => expect(screen.queryByText(/replacing media/i)).not.toBeInTheDocument());

    jest.useRealTimers();
  });
  it("notifies replace errors when the upload fails", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onReplaceError = jest.fn();
    mockFetchJson({ error: "nope" }, 500);

    const { fileInput } = setupMedia({
      item: baseItem,
      onReplace: jest.fn(),
      onReplaceError,
    });

    await user.upload(fileInput, makeFile());

    await waitFor(() => expect(onReplaceError).toHaveBeenCalledWith("Failed to upload replacement"));

    expect(screen.getAllByText(/replacing media/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Failed to upload replacement")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /media actions/i })).toBeDisabled();

    act(() => {
      jest.runAllTimers();
    });
    jest.useRealTimers();
  });
  it("renders multi-select controls with accessible labels and toggles selection state", async () => {
    const user = userEvent.setup();
    const onBulkToggle = jest.fn();
    const { rerender } = render(
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

    const checkbox = screen.getByRole("checkbox", { name: "Select media" });
    await user.click(checkbox);

    expect(onBulkToggle).toHaveBeenNthCalledWith(1, baseItem, true);

    rerender(
      <MediaFileItem
        item={baseItem}
        shop="shop"
        onDelete={jest.fn()}
        onReplace={jest.fn()}
        selectionEnabled
        selected
        onBulkToggle={onBulkToggle}
      />
    );

    const deselectCheckbox = screen.getByRole("checkbox", {
      name: "Deselect media",
    });
    await user.click(deselectCheckbox);

    expect(onBulkToggle).toHaveBeenNthCalledWith(2, baseItem, false);
  });
  it("calls onSelect when the overlay button is pressed", async () => {
    const user = userEvent.setup();
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

    await user.click(screen.getByLabelText("Open details"));
    expect(onSelect).toHaveBeenCalledWith(baseItem);
  });
  it("exposes a select button when onSelect is provided", async () => {
    const user = userEvent.setup();
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

    await user.click(screen.getByLabelText("Select media"));
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

    expect(screen.getAllByText(/replacing media/i).length).toBeGreaterThan(0);
    expect(screen.getByText("45%")).toBeInTheDocument();
  });
  it("displays loading indicators when replacing is in progress", () => {
    render(
      <MediaFileItem
        item={baseItem}
        shop="shop"
        onDelete={jest.fn()}
        onReplace={jest.fn()}
        onSelect={jest.fn()}
        replacing
      />
    );

    const openDetailsButton = screen.getByLabelText("Open details");
    expect(openDetailsButton).toBeDisabled();
    expect(within(openDetailsButton).getByText(/replacing media/i)).toBeInTheDocument();
  });
  it("renders a deleting overlay and disables interactions", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    const { container } = render(
      <MediaFileItem
        item={baseItem}
        shop="shop"
        onDelete={jest.fn()}
        onReplace={jest.fn()}
        onSelect={onSelect}
        selectionEnabled
        deleting
      />
    );

    expect(screen.getAllByText(/deleting media/i).length).toBeGreaterThan(0);
    const mediaActions = screen.getByRole("button", { name: /media actions/i });
    expect(mediaActions).toBeDisabled();
    const selectButton = screen.getByRole("button", { name: "Select media" });
    const openDetailsButton = screen.getByRole("button", { name: "Open details" });
    const checkbox = screen.getByRole("checkbox", { name: "Select media" });
    expect(selectButton).toBeDisabled();
    expect(openDetailsButton).toBeDisabled();
    expect(checkbox).toBeDisabled();
    expect(within(openDetailsButton).getByText(/deleting media/i)).toBeInTheDocument();
    const fileInput = (container.querySelector('input[type="file"]') as HTMLInputElement);
    expect(fileInput).toBeDisabled();
    await user.click(selectButton);
    expect(onSelect).not.toHaveBeenCalled();
  });
  it("locks controls when replacement is reported externally", () => {
    const { container } = render(
      <MediaFileItem
        item={{
          ...baseItem,
          status: "replacing",
          replaceProgress: 45,
        }}
        shop="shop"
        onDelete={jest.fn()}
        onReplace={jest.fn()}
        onSelect={jest.fn()}
        selectionEnabled
        selected
      />
    );

    expect(screen.getAllByText(/replacing media/i).length).toBeGreaterThan(0);
    expect(screen.getByText("45%")).toBeInTheDocument();
    const mediaActions = screen.getByRole("button", { name: /media actions/i });
    expect(mediaActions).toBeDisabled();
    const selectButton = screen.getByRole("button", { name: "Select media" });
    const openDetailsButton = screen.getByRole("button", { name: "Open details" });
    const checkbox = screen.getByRole("checkbox", { name: "Deselect media" });
    expect(selectButton).toBeDisabled();
    expect(openDetailsButton).toBeDisabled();
    expect(checkbox).toBeDisabled();
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeDisabled();
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
