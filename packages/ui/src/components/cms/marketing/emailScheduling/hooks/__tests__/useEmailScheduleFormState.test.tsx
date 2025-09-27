import React from "react";
import { render, act } from "@testing-library/react";
import { useEmailScheduleFormState, type EmailScheduleFormState } from "../useEmailScheduleFormState";

function renderHookUI(opts?: Parameters<typeof useEmailScheduleFormState>[0]) {
  let api: EmailScheduleFormState | null = null;
  function Harness() {
    api = useEmailScheduleFormState(opts || {});
    return null;
  }
  render(<Harness />);
  return () => api!;
}

describe("useEmailScheduleFormState", () => {
  it("validates required fields and shows toast on error", async () => {
    const get = renderHookUI();
    await act(async () => {
      await get().handleSubmit({ preventDefault: () => {} } as any);
    });
    expect(get().status).toBe("error");
    expect(get().toast.open).toBe(true);
    // set values clears specific errors and recomputes preview
    const onStatus = jest.fn();
    const get2 = renderHookUI({ onStatusChange: onStatus });
    const api2 = get2();
    act(() => {
      get2().updateValue("subject", "Hello");
      get2().updateValue("sendDate", "2025-01-01");
      get2().updateValue("sendTime", "12:00");
      get2().updateValue("timezone", "UTC");
      get2().updateValue("segment", "all");
      get2().updateValue("followUpEnabled", true);
      get2().updateValue("followUpDelayHours", 24);
    });
    await act(async () => { await get2().handleSubmit({ preventDefault: () => {} } as any); });
    // Expect success path reached
    expect(get2().status).toBe("success");
    expect(onStatus).toHaveBeenCalledWith("success");
    expect(get2().toast.open).toBe(true);
  });

  it("passes values to onSubmit and handles failure", async () => {
    const ok = jest.fn().mockResolvedValue(undefined);
    const get = renderHookUI({ defaultValues: { subject: "Hi", sendDate: "2025-01-01", sendTime: "09:00", timezone: "UTC", segment: "all" }, onSubmit: ok });
    await act(async () => { await get().handleSubmit({ preventDefault: () => {} } as any); });
    expect(ok).toHaveBeenCalled();

    const fail = jest.fn().mockRejectedValue(new Error("boom"));
    const get2 = renderHookUI({ defaultValues: { subject: "Hi", sendDate: "2025-01-01", sendTime: "09:00", timezone: "UTC", segment: "all" }, onSubmit: fail });
    await act(async () => { await get2().handleSubmit({ preventDefault: () => {} } as any); });
    expect(get2().status).toBe("error");
    expect(get2().toast.open).toBe(true);
  });
});
