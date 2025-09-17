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

import MediaDetailsPanel from "../MediaDetailsPanel";

const baseItem = {
  url: "https://cdn.example.com/a.jpg",
  type: "image" as const,
  title: "Hero banner",
  altText: "Hero banner",
  tags: ["homepage", "featured"],
};

describe("MediaDetailsPanel", () => {
  it("validates that a title is provided", async () => {
    const onSave = jest.fn();
    const onClose = jest.fn();

    render(
      <MediaDetailsPanel open item={baseItem} onSave={onSave} onClose={onClose} />
    );

    const titleInput = screen.getByLabelText(/title/i);
    await userEvent.clear(titleInput);
    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/title is required/i);
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("disables form fields while the save promise is pending", async () => {
    let resolveSave: () => void;
    const onSave = jest.fn(() => new Promise<void>((resolve) => {
      resolveSave = resolve;
    }));
    const onClose = jest.fn();

    render(
      <MediaDetailsPanel open item={baseItem} onSave={onSave} onClose={onClose} />
    );

    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));
    expect(onSave).toHaveBeenCalled();

    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
    const fieldset = titleInput.closest("fieldset") as HTMLFieldSetElement;
    await waitFor(() => expect(fieldset.disabled).toBe(true));

    act(() => resolveSave!());
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("normalizes form values and closes once saved", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();

    render(
      <MediaDetailsPanel open item={baseItem} onSave={onSave} onClose={onClose} />
    );

    const altInput = screen.getByLabelText(/alt text/i);
    const tagsInput = screen.getByLabelText(/tags/i);

    fireEvent.change(altInput, { target: { value: "  A hero alt  " } });
    fireEvent.change(tagsInput, { target: { value: "featured,  primary ,\n hero" } });

    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0]).toEqual({
      title: "Hero banner",
      altText: "A hero alt",
      description: "",
      tags: ["featured", "primary", "hero"],
    });
    expect(onClose).toHaveBeenCalled();
  });
});
