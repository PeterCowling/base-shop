import { render, fireEvent, waitFor, act, screen } from "@testing-library/react";
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
import MediaManager from "../MediaManager";

describe("MediaManager", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("uploads dropped files and shows progress", async () => {
    const onDelete = jest.fn();
    let resolveFetch: (value: Response) => void;
    global.fetch = jest.fn(
      () =>
        new Promise((res) => {
          resolveFetch = res;
        })
    ) as any;

    const { getByLabelText, getByText, queryByText, queryAllByText } = render(
      <MediaManager shop="shop" initialFiles={[]} onDelete={onDelete} />
    );

    const dropzone = getByLabelText(/drop image or video here/i);
    const file = new File(["file"], "video.mp4", { type: "video/mp4" });
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    const uploadButton = getByText("Upload");
    fireEvent.click(uploadButton);

    const progressEl = getByText("Uploaded 0/1");

    await act(async () => {
      resolveFetch!(
        new Response(
          JSON.stringify({ url: "new.mp4", type: "video" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    });
    await waitFor(() =>
      expect(queryByText("Uploaded 0/1")).not.toBeInTheDocument()
    );
    await waitFor(() => expect(queryAllByText("Delete").length).toBe(1));
  });

  it("calls onDelete when confirming deletion", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn().mockResolvedValue(undefined);
    render(
      <MediaManager
        shop="shop"
        initialFiles={[{ url: "old.mp4", type: "video" }]}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole("button", { name: /media actions/i }));
    await user.click(await screen.findByText("Delete"));
    await user.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() =>
      expect(onDelete).toHaveBeenCalledWith("shop", "old.mp4")
    );
    await waitFor(() =>
      expect(screen.queryByText("old.mp4")).not.toBeInTheDocument()
    );
  });

  it("displays error message when upload fails", async () => {
    const onDelete = jest.fn();
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ error: "Upload failed" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    ) as any;

    const { getByLabelText, getByText, findByText } = render(
      <MediaManager shop="shop" initialFiles={[]} onDelete={onDelete} />
    );

    const dropzone = getByLabelText(/drop image or video here/i);
    const file = new File(["file"], "video.mp4", { type: "video/mp4" });
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    fireEvent.click(getByText("Upload"));

    await findByText("Upload failed");
  });
});
