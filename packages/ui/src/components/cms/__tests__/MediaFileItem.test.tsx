import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock(
  "@radix-ui/react-dropdown-menu",
  () => {
    const React = require("react");
    const withAsChild = (
      Component: any,
      options: { role?: string; extraProps?: Record<string, unknown> } = {}
    ) =>
      React.forwardRef((props: any, ref: React.Ref<any>) => {
        const {
          asChild,
          children,
          onSelect,
          sideOffset: _sideOffset,
          alignOffset: _alignOffset,
          collisionPadding: _collisionPadding,
          ...rest
        } = props;
        const merged: Record<string, unknown> = {
          ref,
          role: options.role,
          ...options.extraProps,
          ...rest,
        };
        if (onSelect && typeof merged.onClick !== "function") {
          merged.onClick = onSelect;
        }
        if (asChild && React.isValidElement(children)) {
          return React.cloneElement(children, merged);
        }
        return React.createElement(Component, merged, children);
      });

    return {
      __esModule: true,
      Root: ({ children }: any) => <div role="menu">{children}</div>,
      Trigger: withAsChild("button", {
        extraProps: { "aria-haspopup": "menu" },
      }),
      Portal: ({ children }: any) => children,
      Content: withAsChild("div"),
      Item: withAsChild("div", { role: "menuitem" }),
      CheckboxItem: withAsChild("div", { role: "menuitemcheckbox" }),
      RadioGroup: ({ children }: any) => <div>{children}</div>,
      RadioItem: withAsChild("div", { role: "menuitemradio" }),
      Label: ({ children }: any) => <div>{children}</div>,
      Separator: () => <hr />,
      Group: ({ children }: any) => <div>{children}</div>,
      Sub: ({ children }: any) => <div>{children}</div>,
      SubContent: withAsChild("div"),
      SubTrigger: withAsChild("button"),
      Shortcut: ({ children }: any) => <span>{children}</span>,
    };
  },
  { virtual: true }
);

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

  it("marks the media actions trigger as a menu for assistive tech", () => {
    render(
      <MediaFileItem
        item={baseItem}
        shop="shop"
        onDelete={jest.fn()}
        onReplace={jest.fn()}
      />
    );

    const trigger = screen.getByRole("button", { name: /media actions/i });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
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

  it("notifies when bulk selection is cleared", () => {
    const onBulkToggle = jest.fn();
    render(
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

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(onBulkToggle).toHaveBeenCalledWith(baseItem, false);
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

    fireEvent.click(screen.getByText("Open details"));
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

  it("displays upload overlay while a replacement is in flight", async () => {
    jest.useFakeTimers();
    const onDelete = jest.fn().mockResolvedValue(undefined);
    const onReplace = jest.fn();
    let resolveFetch: (response: Response) => void;
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
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

    expect(screen.getByText(/replacing asset/i)).toBeInTheDocument();

    resolveFetch!(
      new Response(JSON.stringify({ url: "http://example.com/new.jpg", type: "image" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await waitFor(() => expect(onReplace).toHaveBeenCalled());
    act(() => {
      jest.runAllTimers();
    });
    jest.useRealTimers();

    await waitFor(() =>
      expect(screen.queryByText(/replacing asset/i)).not.toBeInTheDocument()
    );
  });

  it("surfaces replacement failures to the user", async () => {
    jest.useFakeTimers();
    const onDelete = jest.fn().mockResolvedValue(undefined);
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ error: "Upload failed" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { container } = render(
      <MediaFileItem
        item={baseItem}
        shop="shop"
        onDelete={onDelete}
        onReplace={jest.fn()}
      />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["hello"], "hello.png", { type: "image/png" });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    expect(screen.getByText(/replacing asset/i)).toBeInTheDocument();
    await waitFor(() => screen.getByText(/failed to upload replacement/i));

    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
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
