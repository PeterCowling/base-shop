import "@testing-library/jest-dom";

import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import EmailBookingButton from "../EmailBookingButton";

const sendBookingEmailMock = jest.fn();
const logActivityMock = jest.fn();
const showToastMock = jest.fn();

jest.mock("../../../hooks/data/useGuestDetails", () => ({
  __esModule: true,
  default: () => ({
    guestsDetails: {
      BOOK1: {
        occ1: { email: "one@example.com" },
        occ2: { email: "two@example.com" },
      },
    },
    validationError: null,
  }),
}));

jest.mock("../../../services/useBookingEmail", () => ({
  __esModule: true,
  default: () => ({
    sendBookingEmail: (...args: unknown[]) => sendBookingEmailMock(...args),
    loading: false,
    message: "",
  }),
}));

jest.mock("../../../hooks/mutations/useActivitiesMutations", () => ({
  __esModule: true,
  default: () => ({
    logActivity: (...args: unknown[]) => logActivityMock(...args),
  }),
}));

jest.mock("../../../utils/toastUtils", () => ({
  __esModule: true,
  showToast: (...args: [string, string]) => showToastMock(...args),
}));

jest.mock("../tooltip/CustomTooltip", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("EmailBookingButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    logActivityMock.mockResolvedValue(undefined);
  });

  it("logs activity code 26 for authoritative occupant ids on success", async () => {
    sendBookingEmailMock.mockResolvedValue({
      success: true,
      bookingRef: "BOOK1",
      occupantIds: ["occ1", "occ2"],
      recipients: ["one@example.com", "two@example.com"],
      occupantLinks: ["https://example.com/occ1", "https://example.com/occ2"],
      draftId: "draft-1",
    });

    render(
      <EmailBookingButton
        bookingRef="BOOK1"
        isFirstForBooking={true}
        activities={[]}
      />,
    );

    await userEvent.click(screen.getByTitle("Send booking email"));

    await waitFor(() => {
      expect(sendBookingEmailMock).toHaveBeenCalledWith("BOOK1", {
        occ1: "one@example.com",
        occ2: "two@example.com",
      });
    });

    expect(logActivityMock).toHaveBeenCalledTimes(2);
    expect(logActivityMock).toHaveBeenCalledWith("occ1", 26);
    expect(logActivityMock).toHaveBeenCalledWith("occ2", 26);
    expect(showToastMock).toHaveBeenCalledWith("Email sent", "success");
  });

  it("does not log activity when booking email draft creation fails", async () => {
    sendBookingEmailMock.mockResolvedValue({
      success: false,
      bookingRef: "BOOK1",
      occupantIds: [],
      recipients: [],
      occupantLinks: [],
      error: "MCP unavailable",
    });

    render(
      <EmailBookingButton
        bookingRef="BOOK1"
        isFirstForBooking={true}
        activities={[]}
      />,
    );

    await userEvent.click(screen.getByTitle("Send booking email"));

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith("MCP unavailable", "error");
    });
    expect(logActivityMock).not.toHaveBeenCalled();
  });

  it("shows error when draft succeeds but activity logging fails", async () => {
    sendBookingEmailMock.mockResolvedValue({
      success: true,
      bookingRef: "BOOK1",
      occupantIds: ["occ1", "occ2"],
      recipients: ["one@example.com", "two@example.com"],
      occupantLinks: ["https://example.com/occ1", "https://example.com/occ2"],
      draftId: "draft-1",
    });
    logActivityMock.mockRejectedValue(new Error("activity write failed"));

    render(
      <EmailBookingButton
        bookingRef="BOOK1"
        isFirstForBooking={true}
        activities={[]}
      />,
    );

    await userEvent.click(screen.getByTitle("Send booking email"));

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith(
        "Email sent, but activity logging failed. Please check history.",
        "error"
      );
    });
    expect(showToastMock).not.toHaveBeenCalledWith(
      "Email sent",
      "success"
    );
  });
});
