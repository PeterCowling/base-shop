import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

jest.mock("../../../utils/toastUtils", () => ({ showToast: jest.fn() }));
import { showToast } from "../../../utils/toastUtils";
const showToastMock = showToast as unknown as jest.Mock;

import HoursChip from "../HoursChip";
import BookingRefChipPrepay from "../BookingRefChipPrepay";
import CheckInDateChip from "../CheckInDateChip";

describe("HoursChip", () => {
  it("renders N/A when hours are null", () => {
    render(<HoursChip hoursElapsed={null} thresholdHours={24} />);
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("applies success style when below threshold", () => {
    render(<HoursChip hoursElapsed={10} thresholdHours={24} />);
    const chip = screen.getByText("10h");
    expect(chip).toHaveClass("bg-success-main");
  });

  it("applies warning style when above threshold", () => {
    render(<HoursChip hoursElapsed={30} thresholdHours={24} />);
    const chip = screen.getByText("30h");
    expect(chip).toHaveClass("bg-warning-main");
  });
});

describe("BookingRefChipPrepay", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("copies booking reference on click", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    // @ts-expect-error - allow assignment for testing
    global.navigator.clipboard = { writeText };
    render(<BookingRefChipPrepay bookingRef="ABC" hasCard={true} />);
    fireEvent.click(screen.getByRole("button", { name: /copy booking reference abc/i }));
    expect(writeText).toHaveBeenCalledWith("ABC");
    await waitFor(() =>
      expect(showToastMock).toHaveBeenCalledWith(
        expect.stringContaining("ABC"),
        "success"
      )
    );
  });

  it("handles clipboard failure", async () => {
    const writeText = jest.fn().mockRejectedValue(new Error("fail"));
    // @ts-expect-error - allow assignment for testing
    global.navigator.clipboard = { writeText };
    render(<BookingRefChipPrepay bookingRef="DEF" hasCard={false} />);
    fireEvent.click(screen.getByRole("button", { name: /copy booking reference def/i }));
    await waitFor(() =>
      expect(showToastMock).toHaveBeenCalledWith(
        "Failed to copy booking reference",
        "error"
      )
    );
  });
});

describe("CheckInDateChip", () => {
  beforeAll(() => {
    jest.setSystemTime(new Date("2025-01-01"));
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it("marks upcoming dates within 7 days", () => {
    const date = "2025-01-05"; // 4 days later
    render(<CheckInDateChip checkInDate={date} />);
    const chip = screen.getByText(/jan 5, 2025/i);
    expect(chip).toHaveClass("bg-warning-main");
  });

  it("marks dates outside window as info", () => {
    const date = "2025-02-01";
    render(<CheckInDateChip checkInDate={date} />);
    const chip = screen.getByText(/feb 1, 2025/i);
    expect(chip).toHaveClass("bg-info-main");
  });

  it("handles missing date", () => {
    render(<CheckInDateChip />);
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });
});
