/** @jest-environment jsdom */
import { render, screen, waitFor } from "@testing-library/react";

import Scanner from "../src/app/returns/mobile/Scanner";

describe("Scanner error branches", () => {
  const origRAF = global.requestAnimationFrame;
  const origMedia = navigator.mediaDevices;
  const origPlay = (HTMLMediaElement.prototype as any).play;

  beforeEach(() => {
    (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(0);
      return 0 as unknown as number;
    };
    (navigator as any).mediaDevices = {
      getUserMedia: jest.fn().mockResolvedValue({ getTracks: () => [{ stop: jest.fn() }] }),
    } as any;
    (HTMLMediaElement.prototype as any).play = jest.fn().mockResolvedValue(undefined);
  });
  afterEach(() => {
    (global as any).requestAnimationFrame = origRAF;
    (navigator as any).mediaDevices = origMedia as any;
    (HTMLMediaElement.prototype as any).play = origPlay;
    jest.resetAllMocks();
  });

  it("recovers when detector throws once", async () => {
    let n = 0;
    (window as any).BarcodeDetector = class {
      async detect() {
        if (n++ === 0) throw new Error("transient");
        return [{ rawValue: "ok" }];
      }
    };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true });
    render(<Scanner allowedZips={[]} />);
    await waitFor(() => expect(screen.getByText(/Return recorded/)).toBeInTheDocument());
  });

  it("shows error when finalize POST fails", async () => {
    (window as any).BarcodeDetector = class {
      async detect() { return [{ rawValue: "E1" }]; }
    };
    (global as any).fetch = jest.fn().mockRejectedValue(new Error("boom"));
    render(<Scanner allowedZips={[]} />);
    await waitFor(() => expect(screen.getByText(/Failed to record return\./)).toBeInTheDocument());
  });
});

