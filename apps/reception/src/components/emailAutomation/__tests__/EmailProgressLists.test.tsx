import "@testing-library/jest-dom";

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { showToast } from "../../../utils/toastUtils";
import EmailProgressLists, {
  type EmailProgressListItem,
} from "../EmailProgressLists";

jest.mock("../../../utils/toastUtils", () => ({ showToast: jest.fn() }));

const sampleData: EmailProgressListItem[] = [
  {
    occupantId: "1",
    bookingRef: "BR1",
    occupantName: "Alice",
    occupantEmail: "alice@example.com",
    hoursElapsed: 1,
    currentCode: 1,
    arrivalDate: "2025-01-01",
  },
  {
    occupantId: "2",
    bookingRef: "BR2",
    occupantName: "Bob",
    occupantEmail: "bob@example.com",
    hoursElapsed: 2,
    currentCode: 1,
    arrivalDate: "2025-01-02",
  },
  {
    occupantId: "3",
    bookingRef: "BR3",
    occupantName: "Carol",
    occupantEmail: "carol@example.com",
    hoursElapsed: 3,
    currentCode: 2,
    arrivalDate: "2025-01-03",
  },
];

describe("EmailProgressLists", () => {
  it("groups rows by currentCode and handles button clicks", async () => {
    const logNextActivity = jest.fn(() => Promise.resolve());
    const logConfirmActivity = jest.fn(() => Promise.resolve());

    render(
      <EmailProgressLists
        emailData={sampleData}
        logNextActivity={logNextActivity}
        logConfirmActivity={logConfirmActivity}
      />
    );

    // Ensure groups are rendered with correct counts
    const code1Header = screen.getByText("Booking Created (2)");
    const code1Section = code1Header.parentElement as HTMLElement;
    expect(within(code1Section).getAllByRole("listitem").length).toBe(2);

    const code2Header = screen.getByText("First Reminder Sent (1)");
    const code2Section = code2Header.parentElement as HTMLElement;
    expect(within(code2Section).getAllByRole("listitem").length).toBe(1);

    // Click next on Alice - should move her to the next list
    const aliceRow = screen.getByText("Alice").closest("li") as HTMLElement;
    await userEvent.click(
      within(aliceRow).getByRole("button", { name: /send first reminder/i })
    );
    expect(logNextActivity).toHaveBeenCalledWith({ bookingRef: "BR1" });

    await waitFor(() => {
      const updatedCode1 = screen.getByText(/^Booking Created/)
        .parentElement as HTMLElement;
      const updatedCode2 = screen.getByText(/^First Reminder Sent/)
        .parentElement as HTMLElement;
      expect(within(updatedCode1).getAllByRole("listitem").length).toBe(1);
      expect(within(updatedCode2).getAllByRole("listitem").length).toBe(2);
    });

    const aliceRowMoved = screen
      .getByText("Alice")
      .closest("li") as HTMLElement;

    // Click confirm on Alice - should remove her row
    await userEvent.click(
      within(aliceRowMoved).getByRole("button", { name: /confirm/i })
    );
    expect(logConfirmActivity).toHaveBeenCalledWith({ bookingRef: "BR1" });
    await waitFor(() =>
      expect(screen.queryByText("Alice")).not.toBeInTheDocument()
    );

    const updatedCode1Header = screen.getByText("Booking Created (1)");
    const updatedCode1 = updatedCode1Header.parentElement as HTMLElement;
    expect(within(updatedCode1).getAllByRole("listitem").length).toBe(1);

    const updatedCode2Header = screen.getByText(/^First Reminder Sent/);
    const updatedCode2 = updatedCode2Header.parentElement as HTMLElement;
    expect(within(updatedCode2).getAllByRole("listitem").length).toBe(1);
  });

  it("updates section counts when guests move or are removed", async () => {
    const logNextActivity = jest.fn(() => Promise.resolve());
    const logConfirmActivity = jest.fn(() => Promise.resolve());

    const { rerender } = render(
      <EmailProgressLists
        emailData={sampleData}
        logNextActivity={logNextActivity}
        logConfirmActivity={logConfirmActivity}
      />
    );

    // initial counts
    expect(screen.getByText("Booking Created (2)")).toBeInTheDocument();
    expect(screen.getByText("First Reminder Sent (1)")).toBeInTheDocument();

    // Parent updates: Alice removed, Bob moves to stage 2
    rerender(
      <EmailProgressLists
        emailData={[{ ...sampleData[1], currentCode: 2 }, sampleData[2]]}
        logNextActivity={logNextActivity}
        logConfirmActivity={logConfirmActivity}
      />
    );

    // Booking Created section should disappear and First Reminder count increase
    expect(screen.queryByText(/^Booking Created/)).not.toBeInTheDocument();
    expect(screen.getByText("First Reminder Sent (2)")).toBeInTheDocument();

    // Confirm Bob -> count should decrease
    const bobRow = screen.getByText("Bob").closest("li") as HTMLElement;
    await userEvent.click(
      within(bobRow).getByRole("button", { name: /confirm/i })
    );
    await waitFor(() =>
      expect(screen.queryByText("Bob")).not.toBeInTheDocument()
    );
    expect(screen.getByText("First Reminder Sent (1)")).toBeInTheDocument();
  });

  it("omits optional chips when data missing", () => {
    const item: EmailProgressListItem = {
      occupantId: "4",
      bookingRef: "BR4",
      occupantName: "Dave",
      occupantEmail: "dave@example.com",
      hoursElapsed: null,
      currentCode: 1,
    };

    render(
      <EmailProgressLists
        emailData={[item]}
        logNextActivity={jest.fn()}
        logConfirmActivity={jest.fn()}
      />
    );

    const row = screen.getByText("Dave").closest("li") as HTMLElement;
    expect(within(row).queryByText(/\d+h/)).toBeNull();
    expect(screen.queryByText("BR4")).toBeInTheDocument();
    expect(screen.queryByText("Dave")).toBeInTheDocument();
    expect(within(row).queryByText(/\d{4}-\d{2}-\d{2}/)).toBeNull();
  });

  it("renders cancelled rows without actions", () => {
    const item: EmailProgressListItem = {
      occupantId: "5",
      bookingRef: "BR5",
      occupantName: "Eve",
      occupantEmail: "eve@example.com",
      hoursElapsed: 5,
      currentCode: 4,
    };

    render(
      <EmailProgressLists
        emailData={[item]}
        logNextActivity={jest.fn()}
        logConfirmActivity={jest.fn()}
      />
    );

    const header = screen.getByText("Cancelled (1)");
    expect(header).toBeInTheDocument();

    const row = screen.getByText("Eve").closest("li") as HTMLElement;
    // Cancelled rows should only contain the copy booking reference button
    const buttons = within(row).getAllByRole("button");
    expect(buttons).toHaveLength(1);
    expect(
      within(row).getByRole("button", { name: /copy booking reference/i })
    ).toBeInTheDocument();
  });

  it("shows errors and keeps row when actions fail", async () => {
    const logNextActivity = jest.fn(() => Promise.reject(new Error("fail")));
    const logConfirmActivity = jest.fn(() => Promise.reject(new Error("fail")));

    render(
      <EmailProgressLists
        emailData={[sampleData[0]]}
        logNextActivity={logNextActivity}
        logConfirmActivity={logConfirmActivity}
      />
    );

    const row = screen.getByText("Alice").closest("li") as HTMLElement;
    await userEvent.click(
      within(row).getByRole("button", { name: /send first reminder/i })
    );

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        "Error logging next activity for BR1",
        "error"
      );
    });

    await userEvent.click(
      within(row).getByRole("button", { name: /confirm/i })
    );

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        "Error logging confirm activity for BR1",
        "error"
      );
    });

    expect(screen.getByText("Booking Created (1)")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });
});
