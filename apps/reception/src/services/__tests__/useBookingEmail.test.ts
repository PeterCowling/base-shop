import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  FIREBASE_BASE_URL,
  OCCUPANT_LINK_PREFIX,
} from "../../utils/emailConstants";
import useBookingEmail, { fetchGuestEmails } from "../useBookingEmail";

// Helper to create a mock fetch Response
function jsonResponse<T>(data: T) {
  return { json: async () => data } as Response;
}

function textResponse(text: string) {
  return { text: async () => text } as Response;
}

describe("useBookingEmail", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sendBookingEmail builds correct query", async () => {
    const fetchMock = vi.fn();
    (global as unknown as { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;
    // 1st call: booking guest IDs
    fetchMock.mockResolvedValueOnce(jsonResponse({ guestA: {}, guestB: {} }));
    // 2nd call: guest emails
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        guestA: { email: "a@example.com" },
        guestB: { email: "b@example.com" },
      })
    );
    // 3rd call: send email
    fetchMock.mockResolvedValueOnce(textResponse("ok"));

    const { result } = renderHook(() => useBookingEmail());

    await act(async () => {
      await result.current.sendBookingEmail("BOOK123", {
        guestA: "override@example.com",
      });
    });

    const recipients = ["override@example.com", "b@example.com"];
    const links = ["guestA", "guestB"].map(
      (id) => `${OCCUPANT_LINK_PREFIX}${id}`
    );
    const params = new URLSearchParams();
    params.set("bookingRef", "BOOK123");
    if (recipients.length) params.set("recipients", recipients.join(","));
    links.forEach((l) => params.append("occupant", l));

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      `https://script.google.com/macros/s/AKfycbz236VUyVFKEKkJF8QaiL_h9y75XuwWsl82-xfWepZwv1-gBroOr5S4t_og4Fvl4caW/exec?${params.toString()}`
    );
  });

  it("fetchGuestEmails returns id to email map", async () => {
    const fetchMock = vi.fn();
    (global as unknown as { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;

    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        g1: { email: "one@example.com" },
        g2: { email: "two@example.com" },
      })
    );

    const result = await fetchGuestEmails("BR");

    expect(fetchMock).toHaveBeenCalledWith(
      `${FIREBASE_BASE_URL}/guestsDetails/BR.json`
    );
    expect(result).toEqual({ g1: "one@example.com", g2: "two@example.com" });
  });

  it("fetchGuestEmails returns empty object for malformed data", async () => {
    const fetchMock = vi.fn();
    (global as unknown as { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;

    fetchMock.mockResolvedValueOnce(jsonResponse({ bad: { mail: "x" } }));

    const result = await fetchGuestEmails("BR");

    expect(result).toEqual({});
  });

  it("sendBookingEmail surfaces validation errors", async () => {
    const fetchMock = vi.fn();
    (global as unknown as { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;

    fetchMock.mockResolvedValueOnce(jsonResponse("not-object"));

    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const { result } = renderHook(() => useBookingEmail());

    await act(async () => {
      await result.current.sendBookingEmail("BOOKBAD");
    });

    expect(result.current.message).toMatch(/Invalid booking response/);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });
});
