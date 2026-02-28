import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { NotifyMeForm } from "@/components/catalog/NotifyMeForm.client";

jest.mock("@acme/platform-core/analytics/client", () => ({
  logAnalyticsEvent: jest.fn().mockResolvedValue(undefined),
}));

const { logAnalyticsEvent } = jest.requireMock(
  "@acme/platform-core/analytics/client",
) as {
  logAnalyticsEvent: jest.Mock;
};

function setupFetchMock(response: { success?: boolean; error?: string }, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
  });
}

describe("NotifyMeForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("TC-01: renders email input, unchecked consent checkbox, and submit button with productSlug='test-slug'", () => {
    render(<NotifyMeForm productSlug="test-slug" />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    expect(screen.getByRole("button", { name: "Notify me" })).toBeInTheDocument();
  });

  it("TC-02: submitting with valid email and checked consent calls fetch with correct payload", async () => {
    setupFetchMock({ success: true });
    render(<NotifyMeForm productSlug="test-slug" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Notify me" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/notify-me",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          productSlug: "test-slug",
          consent: true,
        }),
      }),
    );
  });

  it("TC-03: API returns { success: true } → success message shown, form hidden, logAnalyticsEvent called", async () => {
    setupFetchMock({ success: true });
    render(<NotifyMeForm productSlug="test-slug" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Notify me" }));

    await waitFor(() =>
      expect(
        screen.getByText(/Thank you/i),
      ).toBeInTheDocument(),
    );

    // Form inputs hidden after success
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();

    // Analytics event fired
    await waitFor(() =>
      expect(logAnalyticsEvent).toHaveBeenCalledWith({
        type: "notify_me_submit",
        productSlug: "test-slug",
      }),
    );
  });

  it("TC-04: API returns { error: 'Consent required' } → error message shown with role=alert", async () => {
    setupFetchMock({ error: "Consent required" }, 400);
    render(<NotifyMeForm productSlug="test-slug" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Notify me" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Consent required"),
    );
  });

  it("TC-05: submit blocked client-side when consent checkbox is unchecked", () => {
    setupFetchMock({ success: true });
    render(<NotifyMeForm productSlug="test-slug" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    // Consent checkbox remains unchecked
    const submitButton = screen.getByRole("button", { name: "Notify me" });
    expect(submitButton).toBeDisabled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("TC-06: submit button is disabled while loading (after submit, before response)", async () => {
    let resolveResponse!: (value: unknown) => void;
    global.fetch = jest.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveResponse = resolve;
      }),
    );
    render(<NotifyMeForm productSlug="test-slug" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Notify me" }));

    // While pending, button should show "Submitting..." and be disabled
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Submitting..." })).toBeDisabled(),
    );

    // Resolve the fetch
    resolveResponse({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });

    await waitFor(() =>
      expect(screen.getByText(/Thank you/i)).toBeInTheDocument(),
    );
  });
});
