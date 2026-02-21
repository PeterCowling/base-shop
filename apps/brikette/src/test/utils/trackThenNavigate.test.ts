// src/test/utils/trackThenNavigate.test.ts
import { trackThenNavigate } from "@/utils/trackThenNavigate";

describe("trackThenNavigate", () => {
  let originalGtag: typeof window.gtag;
  let gtagMock: jest.Mock;
  let navigateMock: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    originalGtag = window.gtag;
    gtagMock = jest.fn();
    navigateMock = jest.fn();
    window.gtag = gtagMock;
  });

  afterEach(() => {
    window.gtag = originalGtag;
    jest.useRealTimers();
  });

  // TC-01: gtag called with transport_type beacon, event_callback, and all passed params
  it("TC-01: fires gtag with transport_type beacon, event_callback, and caller params", () => {
    trackThenNavigate("cta_click", { cta_id: "hero_check_availability" }, navigateMock);

    expect(gtagMock).toHaveBeenCalledTimes(1);
    expect(gtagMock).toHaveBeenCalledWith("event", "cta_click", {
      cta_id: "hero_check_availability",
      transport_type: "beacon",
      event_callback: expect.any(Function),
    });
  });

  // TC-02: navigate called after event_callback fires, not before
  it("TC-02: navigate is not called before event_callback fires", () => {
    trackThenNavigate("cta_click", { cta_id: "hero_check_availability" }, navigateMock);

    // Immediately after the call, navigate must not yet have been invoked
    expect(navigateMock).not.toHaveBeenCalled();

    // Simulate GA4 firing the event_callback
    const callArgs = gtagMock.mock.calls[0][2] as { event_callback: () => void };
    callArgs.event_callback();

    expect(navigateMock).toHaveBeenCalledTimes(1);
  });

  // TC-03: navigate called after timeout if callback never fires
  it("TC-03: navigate is called after timeout when event_callback never fires", () => {
    trackThenNavigate("cta_click", { cta_id: "hero_check_availability" }, navigateMock, 200);

    expect(navigateMock).not.toHaveBeenCalled();

    jest.advanceTimersByTime(200);

    expect(navigateMock).toHaveBeenCalledTimes(1);
  });

  // TC-04: navigate called immediately when gtag is absent
  it("TC-04: navigate is called immediately when window.gtag is absent", () => {
    window.gtag = undefined as unknown as typeof window.gtag;

    trackThenNavigate("cta_click", { cta_id: "hero_check_availability" }, navigateMock);

    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(gtagMock).not.toHaveBeenCalled();
  });

  // TC-05: navigate not called twice when both callback and timeout fire
  it("TC-05: navigate is called exactly once when event_callback fires and timeout also elapses", () => {
    trackThenNavigate("cta_click", { cta_id: "hero_check_availability" }, navigateMock, 200);

    // Fire the event_callback first
    const callArgs = gtagMock.mock.calls[0][2] as { event_callback: () => void };
    callArgs.event_callback();

    // Then let the timeout elapse as well
    jest.advanceTimersByTime(200);

    expect(navigateMock).toHaveBeenCalledTimes(1);
  });
});
