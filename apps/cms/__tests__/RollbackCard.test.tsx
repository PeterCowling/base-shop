import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import RollbackCard from "../src/app/cms/shop/[shop]/RollbackCard";

jest.mock("@acme/ui/components/atoms", () => {
  const React = require("react");

  return {
    __esModule: true,
    Button: React.forwardRef(function Button({ children, ...props }: any, ref: any) {
      return (
        <button ref={ref} {...props}>
          {children}
        </button>
      );
    }),
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Toast: ({ open, message, onClose, ...props }: any) => (
      <div {...props} data-state={open ? "open" : "closed"}>
        {open ? (
          <>
            <span>{message}</span>
            <button type="button" onClick={onClose}>
              Close toast
            </button>
          </>
        ) : null}
      </div>
    ),
  };
});

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe("RollbackCard", () => {
  const originalFetch = global.fetch;
  const successMessage =
    "Rollback requested. The previous version will be restored shortly.";
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    consoleErrorSpy.mockRestore();
  });

  it("shows success toast when rollback succeeds", async () => {
    const deferred = createDeferred<Response>();
    const fetchMock = jest.fn().mockReturnValue(deferred.promise);
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<RollbackCard shop="demo-shop" />);
    const user = userEvent.setup();
    const rollbackButton = screen.getByRole("button", {
      name: /rollback to previous version/i,
    });

    await user.click(rollbackButton);
    expect(rollbackButton).toBeDisabled();
    expect(rollbackButton).toHaveTextContent("Rolling back…");

    deferred.resolve({ ok: true } as Response);

    await waitFor(() => expect(rollbackButton).not.toBeDisabled());
    expect(rollbackButton).toHaveTextContent("Rollback to previous version");
    await waitFor(() => expect(screen.getByText(successMessage)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith("/api/shop/demo-shop/rollback", {
      method: "POST",
    });

    await user.click(screen.getByRole("button", { name: /close toast/i }));
    await waitFor(() =>
      expect(screen.queryByText(successMessage)).not.toBeInTheDocument(),
    );
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("shows server error message when rollback fails", async () => {
    const deferred = createDeferred<Response>();
    const fetchMock = jest.fn().mockReturnValue(deferred.promise);
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<RollbackCard shop="demo-shop" />);
    const user = userEvent.setup();
    const rollbackButton = screen.getByRole("button", {
      name: /rollback to previous version/i,
    });

    await user.click(rollbackButton);
    expect(rollbackButton).toBeDisabled();
    expect(rollbackButton).toHaveTextContent("Rolling back…");

    const error = new Error("Deployment failed");
    const response = {
      ok: false,
      json: jest.fn().mockResolvedValue({ error: error.message }),
    } as unknown as Response;
    deferred.resolve(response);

    await waitFor(() => expect(rollbackButton).not.toBeDisabled());
    expect(rollbackButton).toHaveTextContent("Rollback to previous version");
    await waitFor(() => expect(screen.getByText(error.message)).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /close toast/i }));
    await waitFor(() =>
      expect(screen.queryByText(error.message)).not.toBeInTheDocument(),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Rollback failed",
      expect.objectContaining({ message: error.message }),
    );
  });

  it("falls back to default message when response json parsing fails", async () => {
    const deferred = createDeferred<Response>();
    const fetchMock = jest.fn().mockReturnValue(deferred.promise);
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<RollbackCard shop="demo-shop" />);
    const user = userEvent.setup();
    const rollbackButton = screen.getByRole("button", {
      name: /rollback to previous version/i,
    });

    await user.click(rollbackButton);
    expect(rollbackButton).toBeDisabled();
    expect(rollbackButton).toHaveTextContent("Rolling back…");

    const responseError = new Error("Invalid JSON");
    const response = {
      ok: false,
      json: jest.fn().mockRejectedValue(responseError),
    } as unknown as Response;
    deferred.resolve(response);

    await waitFor(() => expect(rollbackButton).not.toBeDisabled());
    expect(rollbackButton).toHaveTextContent("Rollback to previous version");
    await waitFor(() => expect(screen.getByText("Rollback failed")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /close toast/i }));
    await waitFor(() =>
      expect(screen.queryByText("Rollback failed")).not.toBeInTheDocument(),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Rollback failed",
      expect.objectContaining({ message: "Rollback failed" }),
    );
  });

  it("shows error toast when rollback request rejects", async () => {
    const deferred = createDeferred<Response>();
    const fetchMock = jest.fn().mockReturnValue(deferred.promise);
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<RollbackCard shop="demo-shop" />);
    const user = userEvent.setup();
    const rollbackButton = screen.getByRole("button", {
      name: /rollback to previous version/i,
    });

    await user.click(rollbackButton);
    expect(rollbackButton).toBeDisabled();
    expect(rollbackButton).toHaveTextContent("Rolling back…");

    const networkError = new Error("Network error");
    deferred.reject(networkError);

    await waitFor(() => expect(rollbackButton).not.toBeDisabled());
    expect(rollbackButton).toHaveTextContent("Rollback to previous version");
    await waitFor(() => expect(screen.getByText(networkError.message)).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /close toast/i }));
    await waitFor(() =>
      expect(screen.queryByText(networkError.message)).not.toBeInTheDocument(),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith("Rollback failed", networkError);
  });
});
