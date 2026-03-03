import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import AdminLoginPage from "./page";

const pushMock = jest.fn();
const getSearchParamMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => ({ get: getSearchParamMock }),
}));

describe("AdminLoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSearchParamMock.mockReturnValue(null);
  });

  it("redirects to /admin/products on successful login when no redirect param", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Admin key"), {
      target: { value: "valid-admin-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/admin/products");
    });
  });

  it("redirects to redirect query param on successful login", async () => {
    getSearchParamMock.mockReturnValue("/admin/products/new");
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Admin key"), {
      target: { value: "valid-admin-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/admin/products/new");
    });
  });

  it("shows unauthorized error message on 401 response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "unauthorized" }),
    });

    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Admin key"), {
      target: { value: "wrong-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(screen.getByText("Incorrect admin key.")).toBeInTheDocument();
    });
  });

  it("shows network error message when request fails", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network"));

    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Admin key"), {
      target: { value: "any-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(screen.getByText("Network error. Please try again.")).toBeInTheDocument();
    });
  });
});
