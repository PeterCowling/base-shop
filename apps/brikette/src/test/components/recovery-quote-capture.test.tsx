// apps/brikette/src/test/components/recovery-quote-capture.test.tsx
// Unit tests for the RecoveryQuoteCapture component.
// Tests the server-send path: loading state, success state, error state.

import "@testing-library/jest-dom";

import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { RecoveryQuoteCapture } from "@/components/booking/RecoveryQuoteCapture";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "recovery.title": "Need more time?",
        "recovery.privacyNotice": "We keep booking context only.",
        "recovery.emailLabel": "Your email",
        "recovery.emailPlaceholder": "you@example.com",
        "recovery.consent": "I consent.",
        "recovery.submitted": "Quote sent. Check your email.",
        "recovery.submitCta": "Email me this quote",
        "recovery.sending": "Sending…",
        "recovery.errors.invalidEmail": "Enter a valid email address.",
        "recovery.errors.consentRequired": "Consent is required.",
        "recovery.errors.sendFailed": "Something went wrong. Please try again.",
      };
      return map[key] ?? key;
    },
  }),
}));

jest.mock("@/utils/ga4-events", () => ({
  createBrikClickId: jest.fn(() => "lc-test-id"),
  fireRecoveryLeadCapture: jest.fn(),
}));

jest.mock("@/utils/recoveryQuote", () => ({
  buildRecoveryResumeLink: jest.fn(() => ({
    resumeLink: "https://brikette.com/book?resume=1",
    resumeExpiresAt: "2026-06-08T00:00:00.000Z",
  })),
  persistRecoveryCapture: jest.fn(),
  RECOVERY_CAPTURE_RETENTION_DAYS: 7,
  RECOVERY_CONSENT_VERSION: "v1",
}));

const BASE_CONTEXT = {
  checkin: "2026-06-01",
  checkout: "2026-06-03",
  pax: 1,
  source_route: "/book",
  room_id: "room_10",
};

function renderComponent(overrides?: { isValidSearch?: boolean }) {
  return render(
    <RecoveryQuoteCapture
      isValidSearch={overrides?.isValidSearch ?? true}
      context={BASE_CONTEXT}
      resumePathname="/en/book"
    />,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RecoveryQuoteCapture", () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "accepted", idempotencyKey: "rq:test" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    jest.clearAllMocks();
  });

  // TC-04-01: Form submit with valid email and consent → fetch called with correct URL and body
  it("TC-04-01: valid submit calls fetch with correct URL and body", async () => {
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "guest@test.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));

    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "Email me this quote" }));
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/recovery/quote/send",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "Content-Type": "application/json" }),
          body: expect.stringContaining("guest@test.com"),
        }),
      );
    });
  });

  // TC-04-02: While fetch is in-flight → button shows loading text and is disabled
  it("TC-04-02: shows loading state while fetch is in flight", async () => {
    let resolveFetch: (v: Response) => void;
    fetchSpy.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "guest@test.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));

    act(() => {
      fireEvent.submit(screen.getByRole("button", { name: "Email me this quote" }));
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
    });

    // Resolve fetch to clean up
    act(() => {
      resolveFetch(
        new Response(JSON.stringify({ status: "accepted", idempotencyKey: "rq:test" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });
  });

  // TC-04-03: Fetch returns { status: "accepted" } → submitted state shown
  it("TC-04-03: accepted response shows submitted message", async () => {
    let resolveFetch!: (value: Response) => void;
    fetchSpy.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "guest@test.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));

    const submitButton = screen.getByRole("button", { name: "Email me this quote" });
    const form = submitButton.closest("form");
    expect(form).not.toBeNull();

    await act(async () => {
      fireEvent.submit(form!);
    });

    act(() => {
      resolveFetch(
        new Response(JSON.stringify({ status: "accepted", idempotencyKey: "rq:test" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Quote sent. Check your email.")).toBeInTheDocument();
    });
    expect(screen.queryByText("Something went wrong. Please try again.")).not.toBeInTheDocument();
  });

  // TC-04-04: Fetch returns { status: "duplicate" } → submitted state shown (idempotent success)
  it("TC-04-04: duplicate response shows submitted message", async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ status: "duplicate", idempotencyKey: "rq:test" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "guest@test.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));

    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "Email me this quote" }));
    });

    await waitFor(() => {
      expect(screen.getByText("Quote sent. Check your email.")).toBeInTheDocument();
    });
  });

  // TC-04-05: Fetch returns HTTP 500 (error response) → error message shown, button re-enabled
  it("TC-04-05: error response shows sendFailed error message", async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ error: "send_failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "guest@test.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));

    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "Email me this quote" }));
    });

    await waitFor(() => {
      expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
    });
    // Button should be re-enabled after error
    expect(screen.getByRole("button", { name: "Email me this quote" })).not.toBeDisabled();
  });

  // TC-04-06: fetch throws (network error) → error message shown, button re-enabled
  it("TC-04-06: network error shows sendFailed error message", async () => {
    fetchSpy.mockRejectedValue(new Error("Network error"));

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "guest@test.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));

    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "Email me this quote" }));
    });

    await waitFor(() => {
      expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Email me this quote" })).not.toBeDisabled();
  });

  // TC-04-07: Invalid email (no @) → client-side error, no fetch call
  it("TC-04-07: invalid email shows validation error without fetching", async () => {
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "notanemail" },
    });
    fireEvent.click(screen.getByRole("checkbox"));

    fireEvent.submit(screen.getByRole("button", { name: "Email me this quote" }));

    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // TC-04-08: No consent → client-side error, no fetch call
  it("TC-04-08: missing consent shows validation error without fetching", async () => {
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "guest@test.com" },
    });
    // Do NOT click the checkbox

    fireEvent.submit(screen.getByRole("button", { name: "Email me this quote" }));

    expect(screen.getByText("Consent is required.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // Extra: isValidSearch=false → component returns null
  it("renders nothing when isValidSearch is false", () => {
    const { container } = renderComponent({ isValidSearch: false });
    expect(container.firstChild).toBeNull();
  });
});
