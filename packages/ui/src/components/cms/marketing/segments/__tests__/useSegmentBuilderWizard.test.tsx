import React from "react";
import { render, act } from "@testing-library/react";
import { useSegmentBuilderWizard, type UseSegmentBuilderWizardReturn } from "../useSegmentBuilderWizard";

function renderHookUI(props?: Parameters<typeof useSegmentBuilderWizard>[0]) {
  let api: UseSegmentBuilderWizardReturn | null = null;
  function Harness() {
    api = useSegmentBuilderWizard(props || {});
    return null;
  }
  render(<Harness />);
  return () => api!;
}

describe("useSegmentBuilderWizard", () => {
  it("initializes with defaults and updates preview on changes", () => {
    const get = renderHookUI();
    const api = get();
    expect(api.steps).toHaveLength(3);
    expect(api.currentStep.id).toBe("details");
    expect(api.definition.rules.length).toBeGreaterThan(0);

    const onPreviewChange = jest.fn();
    const get2 = renderHookUI({ onPreviewChange });
    const api2 = get2();
    act(() => api2.updateDefinition({ name: "VIPs" }));
    expect(api2.preview.name).toContain("VIPs");
    expect(onPreviewChange).toHaveBeenCalled();
  });

  it("validates details step and advances when valid; merges external validationErrors", () => {
    const get = renderHookUI({ validationErrors: { name: "server says no" } });
    const api = get();
    // submit with empty name → error + toast
    act(() => api.handleDetailsSubmit({ preventDefault: () => {} } as any));
    expect(api.errors.name).toBeTruthy();
    expect(api.toast.open).toBe(true);
    // set name and resubmit advances step
    act(() => api.updateDefinition({ name: "LTV 500+" }));
    act(() => api.handleDetailsSubmit({ preventDefault: () => {} } as any));
    expect(api.currentStep.id).toBe("rules");
  });

  it("manages rules: add/update/remove and validates before review", () => {
    const get = renderHookUI();
    const api = get();
    const firstId = api.definition.rules[0].id;
    act(() => api.updateRule(firstId, { value: "1000" }));
    expect(api.definition.rules[0].value).toBe("1000");
    act(() => api.addRule());
    const added = api.definition.rules[api.definition.rules.length - 1];
    expect(added).toBeTruthy();
    act(() => api.removeRule(added.id));
    expect(api.definition.rules.find((r) => r.id === added.id)).toBeUndefined();

    // Incomplete rules cause validation error
    act(() => api.updateRule(firstId, { value: "" }));
    act(() => api.handleRulesNext());
    expect(api.errors.rules).toBeTruthy();
    // Fill and proceed
    act(() => api.updateRule(firstId, { value: "1000" }));
    act(() => api.handleRulesNext());
    expect(api.currentStep.id).toBe("review");
  });

  it("handleFinish without onSubmit shows toast; with onSubmit sets success; error path sets error", async () => {
    const getA = renderHookUI();
    const apiA = getA();
    await act(async () => { await apiA.handleFinish(); });
    expect(apiA.toast.open).toBe(true);
    expect(apiA.toast.message).toMatch(/ready to activate/i);

    const onSubmitOk = jest.fn().mockResolvedValue(undefined);
    const getB = renderHookUI({ onSubmit: onSubmitOk });
    const apiB = getB();
    await act(async () => { await apiB.handleFinish(); });
    expect(apiB.status).toBe("success");

    const onSubmitErr = jest.fn().mockRejectedValue(new Error("boom"));
    const getC = renderHookUI({ onSubmit: onSubmitErr });
    const apiC = getC();
    await act(async () => { await apiC.handleFinish(); });
    expect(apiC.status).toBe("error");
    expect(apiC.toast.open).toBe(true);
  });
});
