import { initTimelines, disposeTimelines } from "../timeline";

describe("timeline init + dispose", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    jest.useFakeTimers();
  });
  afterEach(() => {
    disposeTimelines();
    jest.useRealTimers();
  });

  it("applies initial step and plays sequential timeline on load trigger", () => {
    const el = document.createElement("div");
    const cfg = {
      trigger: "load",
      steps: [
        { opacity: 0.2, x: 10, duration: 0 },
        { opacity: 1, x: 20, duration: 100 },
      ],
    };
    el.setAttribute("data-pb-timeline", JSON.stringify(cfg));
    document.body.appendChild(el);
    initTimelines();
    // first step applied immediately without transition
    expect(el.style.opacity).toBe("0.2");
    expect(el.style.transform).toContain("translate(10px, 0px)");
    // advance timers to run next step
    jest.advanceTimersByTime(110);
    expect(el.style.opacity).toBe("1");
    expect(el.style.transform).toContain("translate(20px, 0px)");
  });

  it("binds scroll and interpolates between steps", () => {
    // mock geometry
    Object.defineProperty(window, "innerHeight", { value: 1000, configurable: true });
    const el = document.createElement("div");
    el.getBoundingClientRect = () => ({
      // halfway into view → progress ~0.5
      top: 500,
      bottom: 600,
      left: 0,
      right: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as any);
    const cfg = { trigger: "scroll", steps: [{ at: 0, opacity: 0 }, { at: 1, opacity: 1 }] };
    el.setAttribute("data-pb-timeline", JSON.stringify(cfg));
    document.body.appendChild(el);
    initTimelines();
    // fire scroll → requestAnimationFrame wraps write; flush it
    window.dispatchEvent(new Event("scroll"));
    // run RAF callbacks
    jest.advanceTimersByTime(16);
    // opacity should be ~0.5
    expect(Number(el.style.opacity)).toBeGreaterThan(0.45);
    expect(Number(el.style.opacity)).toBeLessThan(0.55);
  });
});

