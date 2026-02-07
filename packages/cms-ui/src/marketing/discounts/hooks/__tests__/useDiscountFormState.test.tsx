// packages/ui/src/components/cms/marketing/discounts/hooks/__tests__/useDiscountFormState.test.tsx
import React, { type FormEvent } from "react";
import { act,fireEvent, render, screen } from "@testing-library/react";

import { type DiscountFormState,useDiscountFormState } from "../useDiscountFormState";

const mockToast = { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() };
jest.mock("@acme/ui/operations", () => ({
  useToast: () => mockToast,
}));

function Harness({
  defaults,
  onSubmit,
  onStatus,
}: {
  defaults?: Partial<Parameters<typeof useDiscountFormState>[0]["defaultValues"]>;
  onSubmit?: Parameters<typeof useDiscountFormState>[0]["onSubmit"];
  onStatus?: Parameters<typeof useDiscountFormState>[0]["onStatusChange"];
}) {
  const { values, errors, status, update, handleSubmit }: DiscountFormState = useDiscountFormState({
    defaultValues: defaults,
    onSubmit,
    onStatusChange: onStatus,
  });
  return (
    <form onSubmit={(e: FormEvent<HTMLFormElement>) => void handleSubmit(e)}>
      <div data-cy="code-error">{errors.code || ""}</div>
      <div data-cy="status">{status}</div>
      <input
        aria-label="code"
        value={values.code}
        onChange={(e) => update("code", e.target.value)}
      />
      <button type="submit">submit</button>
    </form>
  );
}

describe("useDiscountFormState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("validates and shows toast on error, then clears a field error on update", async () => {
    const onStatus = jest.fn();
    render(<Harness onStatus={onStatus} />);

    await act(async () => {
      fireEvent.click(screen.getByText("submit"));
    });

    // Validation kicks in
    expect(screen.getByTestId("status").textContent).toBe("error");
    expect(onStatus).toHaveBeenCalledWith("validating");
    expect(onStatus).toHaveBeenCalledWith("error");
    expect(screen.getByTestId("code-error").textContent).toMatch(/promo code/i);
    expect(mockToast.error).toHaveBeenCalledWith(expect.stringMatching(/Resolve the highlighted issues/i));

    // Update clears that specific field error
    fireEvent.change(screen.getByLabelText("code"), { target: { value: "SAVE10" } });
    expect(screen.getByTestId("code-error").textContent).toBe("");
  });

  test("successful submission without onSubmit produces draft saved toast", async () => {
    const onStatus = jest.fn();
    render(<Harness onStatus={onStatus} defaults={{ code: "X", value: 5, startDate: new Date().toISOString(), appliesTo: "all" }} />);

    await act(async () => {
      fireEvent.click(screen.getByText("submit"));
    });

    expect(screen.getByTestId("status").textContent).toBe("success");
    expect(onStatus).toHaveBeenCalledWith("success");
    expect(mockToast.success).toHaveBeenCalledWith(expect.stringMatching(/draft saved/i));
  });

  test("onSubmit resolves ➜ success toast", async () => {
    const ok = jest.fn().mockResolvedValue(undefined);
    const onStatus = jest.fn();
    render(
      <Harness
        onSubmit={ok}
        onStatus={onStatus}
        defaults={{ code: "OK", value: 10, startDate: new Date().toISOString(), appliesTo: "all" }}
      />
    );
    await act(async () => {
      fireEvent.click(screen.getByText("submit"));
    });
    expect(ok).toHaveBeenCalled();
    expect(screen.getByTestId("status").textContent).toBe("success");
    expect(mockToast.success).toHaveBeenCalledWith(expect.stringMatching(/Discount saved/i));
  });

  test("onSubmit rejects ➜ error toast", async () => {
    const fail = jest.fn().mockRejectedValue(new Error("Boom"));
    render(
      <Harness
        onSubmit={fail}
        defaults={{ code: "X", value: 1, startDate: new Date().toISOString(), appliesTo: "all" }}
      />
    );
    await act(async () => {
      fireEvent.click(screen.getByText("submit"));
    });
    expect(fail).toHaveBeenCalled();
    expect(screen.getByTestId("status").textContent).toBe("error");
    expect(mockToast.error).toHaveBeenCalledWith(expect.stringMatching(/Boom/i));
  });
});
