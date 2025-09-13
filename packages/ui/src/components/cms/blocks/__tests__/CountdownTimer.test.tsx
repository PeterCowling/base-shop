import { render, screen, act } from "@testing-library/react";
import CountdownTimer from "../CountdownTimer";
import {
  parseTargetDate,
  getTimeRemaining,
  formatDuration,
} from "@acme/date-utils";

jest.mock("@acme/date-utils", () => ({
  parseTargetDate: jest.fn(),
  getTimeRemaining: jest.fn(),
  formatDuration: jest.fn(),
}));

const mockParseTargetDate = parseTargetDate as jest.MockedFunction<
  typeof parseTargetDate
>;
const mockGetTimeRemaining = getTimeRemaining as jest.MockedFunction<
  typeof getTimeRemaining
>;
const mockFormatDuration = formatDuration as jest.MockedFunction<
  typeof formatDuration
>;

describe("CountdownTimer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("returns null when no targetDate", () => {
    mockParseTargetDate.mockReturnValue(undefined);

    const { container } = render(<CountdownTimer />);

    expect(container.firstChild).toBeNull();
  });

  it("renders formatted duration when time remaining is positive", () => {
    mockParseTargetDate.mockReturnValue(new Date("2025-01-01T00:00:00Z"));
    mockGetTimeRemaining.mockReturnValue(5000);
    mockFormatDuration.mockReturnValue("00:05");

    render(<CountdownTimer targetDate="future" />);

    expect(screen.getByText("00:05")).toBeInTheDocument();
  });

  it("passes timezone to parseTargetDate", () => {
    mockParseTargetDate.mockReturnValue(undefined);

    render(
      <CountdownTimer targetDate="future" timezone="America/New_York" />
    );

    expect(mockParseTargetDate).toHaveBeenCalledWith(
      "future",
      "America/New_York"
    );
  });

  it("shows completionText when time runs out", () => {
    mockParseTargetDate.mockReturnValue(new Date("2025-01-01T00:00:00Z"));
    mockGetTimeRemaining
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1000)
      .mockReturnValue(0);
    mockFormatDuration.mockReturnValue("00:01");

    render(
      <CountdownTimer targetDate="future" completionText="Done" />
    );

    expect(screen.getByText("00:01")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("renders null when no completionText and time runs out", () => {
    mockParseTargetDate.mockReturnValue(new Date("2025-01-01T00:00:00Z"));
    mockGetTimeRemaining
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1000)
      .mockReturnValue(0);
    mockFormatDuration.mockReturnValue("00:01");

    const { container } = render(
      <CountdownTimer targetDate="future" />
    );

    expect(screen.getByText("00:01")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(container.firstChild).toBeNull();
  });

  it("updates countdown when timezone changes", () => {
    mockParseTargetDate
      .mockReturnValueOnce(new Date("2025-01-01T00:00:00Z"))
      .mockReturnValue(new Date("2025-01-01T01:00:00Z"));
    mockGetTimeRemaining
      .mockReturnValueOnce(5000)
      .mockReturnValueOnce(5000)
      .mockReturnValue(10000);
    mockFormatDuration
      .mockReturnValueOnce("00:05")
      .mockReturnValue("00:10");

    const { rerender } = render(
      <CountdownTimer targetDate="future" timezone="UTC" />
    );

    expect(screen.getByText("00:05")).toBeInTheDocument();
    expect(mockParseTargetDate).toHaveBeenCalledWith("future", "UTC");

    act(() => {
      rerender(
        <CountdownTimer
          targetDate="future"
          timezone="America/Los_Angeles"
        />
      );
    });

    expect(mockParseTargetDate).toHaveBeenLastCalledWith(
      "future",
      "America/Los_Angeles"
    );
    expect(screen.getByText("00:10")).toBeInTheDocument();
  });
});

