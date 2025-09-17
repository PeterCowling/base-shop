import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

  const createDeferred = <T,>() => {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
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
    const deleteItem = await screen.findByText("Delete");
    await user.click(deleteItem);

    expect(onDelete).toHaveBeenCalledWith(baseItem.url);
  });

  it("provides accessible controls for the media actions dropdown", async () => {
    const user = userEvent.setup();
    render(
      <MediaFileItem
        item={baseItem}
        shop="shop"
        onDelete={jest.fn()}
        onReplace={jest.fn()}
        onSelect={jest.fn()}
      />
    );

    const trigger = screen.getByRole("button", { name: /media actions/i });
    expect(trigger).not.toHaveAttribute("aria-expanded", "true");

    await user.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));

    const pointerMenu = await screen.findByRole("menu");
    const pointerItems = within(pointerMenu).getAllByRole("menuitem");
    expect(pointerItems).toHaveLength(3);
    expect(
      within(pointerMenu).getByRole("menuitem", { name: /view details/i })
    ).toBeInTheDocument();
    expect(
      within(pointerMenu).getByRole("menuitem", { name: /replace/i })
    ).toBeInTheDocument();
    expect(
      within(pointerMenu).getByRole("menuitem", { name: /delete/i })
    ).toBeInTheDocument();

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

  it("shows upload progress while replacing media", async () => {
    jest.useFakeTimers();
    const onDelete = jest.fn();
    const onReplace = jest.fn();
    const deferred = createDeferred<Response>();
    const replacement = { url: "http://example.com/new.jpg", type: "image" };
    (global.fetch as jest.Mock).mockReturnValue(deferred.promise);

    const { container } = render(
      <MediaFileItem
        item={baseItem}
        shop="shop"
        onDelete={onDelete}
        onReplace={onReplace}
        onReplaceSuccess={jest.fn()}
      />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["hello"], "hello.png", { type: "image/png" });

    act(() => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    expect(await screen.findByText("4%"))
      .toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(await screen.findByText("10%"))
      .toBeInTheDocument();

    await act(async () => {
      deferred.resolve(
        new Response(JSON.stringify(replacement), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    expect(await screen.findByText("100%"))
      .toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(400);
    });

    await waitFor(() =>
      expect(screen.queryByText(/replacing asset/i)).not.toBeInTheDocument()
    );

    jest.useRealTimers();
  });

  it("notifies replace errors when the upload fails", async () => {
    jest.useFakeTimers();
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
        onDelete={jest.fn()}
        onReplace={jest.fn()}
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

    expect(screen.getByText(/replacing asset/i)).toBeInTheDocument();
    expect(
      screen.getByText("Failed to upload replacement")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /media actions/i })
    ).toBeDisabled();

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

    fireEvent.click(screen.getByLabelText("Open details"));
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

    fireEvent.click(screen.getByLabelText("Select media"));
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

  it("renders a deleting overlay and disables interactions", () => {
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

    expect(screen.getByText(/deleting asset/i)).toBeInTheDocument();
    const mediaActions = screen.getByRole("button", { name: /media actions/i });
    expect(mediaActions).toBeDisabled();
    const selectButton = screen.getByRole("button", { name: "Select media" });
    const openDetailsButton = screen.getByRole("button", { name: "Open details" });
    const checkbox = screen.getByRole("checkbox", { name: "Select media" });
    expect(selectButton).toBeDisabled();
    expect(openDetailsButton).toBeDisabled();
    expect(checkbox).toBeDisabled();
    expect(within(openDetailsButton).getByText(/deleting media/i)).toBeInTheDocument();
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeDisabled();
    fireEvent.click(selectButton);
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

    expect(screen.getByText(/replacing asset/i)).toBeInTheDocument();
    expect(screen.getByText("45%"))
      .toBeInTheDocument();
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
