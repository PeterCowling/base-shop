import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { showToast } from "../../../utils/toastUtils";
import { KeycardCountForm } from "../KeycardCountForm";

jest.mock("../../../utils/toastUtils", () => ({ showToast: jest.fn() }));
const showToastMock = showToast as unknown as jest.Mock;

describe("KeycardCountForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("confirms valid counts", async () => {
    const onConfirm = jest.fn();
    render(
      <KeycardCountForm expectedCount={0} onConfirm={onConfirm} onCancel={jest.fn()} />
    );
    const input = screen.getByLabelText(/count/i);
    await userEvent.clear(input);
    await userEvent.type(input, "5");
    await userEvent.click(screen.getByRole("button", { name: /go/i }));
    expect(onConfirm).toHaveBeenCalledWith(5);
  });

  it("shows toast for invalid counts", async () => {
    const onConfirm = jest.fn();
    render(
      <KeycardCountForm expectedCount={0} onConfirm={onConfirm} onCancel={jest.fn()} />
    );
    const input = screen.getByLabelText(/count/i);
    await userEvent.clear(input);
    await userEvent.type(input, "-1");
    await userEvent.click(screen.getByRole("button", { name: /go/i }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(showToastMock).toHaveBeenCalledWith(
      "Enter a non-negative number",
      "error"
    );
  });

  it("applies dark mode styles", () => {
    document.documentElement.classList.add("dark");
    render(
      <KeycardCountForm
        expectedCount={0}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    const heading = screen.getByRole("heading", { name: /count keycards/i });
    const container = heading.closest("div.relative") as HTMLElement;
    expect(container).toHaveClass("relative");
    expect(screen.getByRole("button", { name: /go/i })).toHaveClass(
      "bg-primary-main"
    );
    document.documentElement.classList.remove("dark");
  });

  it("hides expected count when showExpected is false (TC-11)", () => {
    render(
      <KeycardCountForm
        expectedCount={5}
        showExpected={false}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.queryByText(/Expected:/)).not.toBeInTheDocument();
  });

  it("shows expected count when showExpected is true (TC-12)", () => {
    render(
      <KeycardCountForm
        expectedCount={5}
        showExpected={true}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByText(/Expected: 5/)).toBeInTheDocument();
  });

  it("calls onChange with parsed integer on input change (TC-13)", async () => {
    const onChange = jest.fn();
    render(
      <KeycardCountForm
        expectedCount={0}
        onChange={onChange}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    const input = screen.getByLabelText(/count/i);
    await userEvent.clear(input);
    await userEvent.type(input, "3");
    expect(onChange).toHaveBeenCalledWith(3);
  });
});
