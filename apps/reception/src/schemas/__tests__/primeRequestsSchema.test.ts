import "@testing-library/jest-dom";

import { primeRequestsByIdSchema } from "../primeRequestsSchema";

describe("primeRequestsByIdSchema", () => {
  it("parses a valid request map", () => {
    expect(() =>
      primeRequestsByIdSchema.parse({
        extension_1: {
          requestId: "extension_1",
          type: "extension",
          status: "pending",
          bookingId: "BOOK1",
          guestUuid: "occ_1",
          guestName: "Guest One",
          submittedAt: 1,
          updatedAt: 1,
          payload: {
            requestedCheckOutDate: "2026-03-01",
          },
        },
      }),
    ).not.toThrow();
  });

  it("fails when status is invalid", () => {
    expect(() =>
      primeRequestsByIdSchema.parse({
        bad: {
          requestId: "bad",
          type: "extension",
          status: "open",
          bookingId: "BOOK1",
          guestUuid: "occ_1",
          guestName: "Guest One",
          submittedAt: 1,
          updatedAt: 1,
        },
      }),
    ).toThrow();
  });
});
