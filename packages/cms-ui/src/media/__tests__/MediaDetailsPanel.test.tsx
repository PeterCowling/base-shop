import type { ComponentProps } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import * as shadcn from "@acme/design-system/shadcn";
import type { MediaItem } from "@acme/types";

import MediaDetailsPanel from "../MediaDetailsPanel";

jest.mock("@acme/design-system/shadcn", () => {
  const React = require("react");
  const base = require("../../../../../../../test/__mocks__/shadcnDialogStub.tsx");
  const openChangeRef: {
    current?: (open: boolean) => void;
  } = {};

  function DialogWrapper({ open, onOpenChange, children }: any) {
    openChangeRef.current = onOpenChange;
    return React.createElement(base.Dialog, { open, onOpenChange }, children);
  }
  DialogWrapper.displayName = "DialogWrapperMock";

  function DialogHeaderMock({ children, ...props }: any) {
    return <div {...props}>{children}</div>;
  }
  DialogHeaderMock.displayName = "DialogHeaderMock";

  function DialogFooterMock({ children, ...props }: any) {
    return <div {...props}>{children}</div>;
  }
  DialogFooterMock.displayName = "DialogFooterMock";

  function DialogDescriptionMock({ children, ...props }: any) {
    return <p {...props}>{children}</p>;
  }
  DialogDescriptionMock.displayName = "DialogDescriptionMock";

  return {
    __esModule: true,
    ...base,
    Dialog: DialogWrapper,
    DialogHeader: DialogHeaderMock,
    DialogFooter: DialogFooterMock,
    DialogDescription: DialogDescriptionMock,
    __mock: {
      get lastOnOpenChange() {
        return openChangeRef.current;
      },
    },
  };
});

const dialogMock = shadcn as unknown as typeof shadcn & {
  __mock: {
    lastOnOpenChange?: (open: boolean) => void;
  };
};

function defer<T>() {
  let resolveFn: (value: T | PromiseLike<T>) => void;
  let rejectFn: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });
  // TypeScript can't see assignments within the executor, so assert defined.
  return {
    promise,
    resolve: resolveFn!,
    reject: rejectFn!,
  };
}

describe("MediaDetailsPanel", () => {
  const baseItem: MediaItem = {
    url: "https://cdn.example.com/image.jpg",
    type: "image",
    title: "Sunset photo",
    altText: "A sunset over the hills",
    tags: ["hero", "", "campaign"],
  };

  const renderPanel = (
    overrides: Partial<ComponentProps<typeof MediaDetailsPanel>> = {}
  ) => {
    const onSubmit = overrides.onSubmit ?? jest.fn();
    const onClose = overrides.onClose ?? jest.fn();
    const props: ComponentProps<typeof MediaDetailsPanel> = {
      open: true,
      pending: false,
      item: baseItem,
      onSubmit,
      onClose,
      ...overrides,
    };

    return {
      user: userEvent.setup(),
      onSubmit,
      onClose,
      ...render(<MediaDetailsPanel {...props} />),
    };
  };

  it("initialises fields from the item and updates local state", async () => {
    const { user } = renderPanel();

    const titleInput = screen.getByLabelText(/title/i);
    const altTextarea = screen.getByLabelText(/alt text/i);
    const tagsInput = screen.getByLabelText(/tags/i);

    expect(titleInput).toHaveValue("Sunset photo");
    expect(altTextarea).toHaveValue("A sunset over the hills");
    expect(tagsInput).toHaveValue("hero, campaign");

    await user.type(titleInput, " updated");
    expect(titleInput).toHaveValue("Sunset photo updated");

    await user.clear(altTextarea);
    await user.type(altTextarea, "New description");
    expect(altTextarea).toHaveValue("New description");

    await user.clear(tagsInput);
    await user.type(tagsInput, " primary , feature ");
    expect(tagsInput).toHaveValue(" primary , feature ");
  });

  it("submits trimmed tags and latest values", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { user } = renderPanel({ onSubmit });

    const titleInput = screen.getByLabelText(/title/i);
    const altTextarea = screen.getByLabelText(/alt text/i);
    const tagsInput = screen.getByLabelText(/tags/i);

    await user.clear(titleInput);
    await user.type(titleInput, "New title");
    await user.clear(altTextarea);
    await user.type(altTextarea, "Updated alt");
    await user.clear(tagsInput);
    await user.type(tagsInput, " hero ,  featured story , ");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "New title",
      altText: "Updated alt",
      tags: ["hero", "featured story"],
    });
  });

  it("submits an empty tags array when the field is blank", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { user } = renderPanel({ onSubmit });

    const tagsInput = screen.getByLabelText(/tags/i);
    await user.clear(tagsInput);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Sunset photo",
      altText: "A sunset over the hills",
      tags: [],
    });
  });

  it("disables the save button while pending and closes via controls", async () => {
    const onClose = jest.fn();
    const { user } = renderPanel({ pending: true, onClose });

    const savingButton = screen.getByRole("button", { name: "Saving…" });
    expect(savingButton).toBeDisabled();
    expect(screen.getByText("Saving…")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    act(() => {
      dialogMock.__mock.lastOnOpenChange?.(false);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes after a successful submit but stays open when the submit fails", async () => {
    const onClose = jest.fn();
    const success = defer<void>();
    const successfulSubmit = jest.fn().mockReturnValue(success.promise);
    const { user, rerender } = renderPanel({ onClose, onSubmit: successfulSubmit });

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(successfulSubmit).toHaveBeenCalledTimes(1);

    await act(async () => {
      success.resolve();
      await success.promise;
      dialogMock.__mock.lastOnOpenChange?.(false);
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    const failure = defer<void>();
    const failingSubmit = jest.fn().mockReturnValue(failure.promise);
    rerender(
      <MediaDetailsPanel
        open
        pending={false}
        item={baseItem}
        onSubmit={failingSubmit}
        onClose={onClose}
      />
    );

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(failingSubmit).toHaveBeenCalledTimes(1);

    await act(async () => {
      failure.reject(new Error("nope"));
      try {
        await failure.promise;
      } catch {
        // swallow rejection for assertion
      }
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
