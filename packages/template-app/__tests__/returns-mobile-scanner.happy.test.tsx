/** @jest-environment jsdom */
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Scanner from "../src/app/returns/mobile/Scanner";

describe("Scanner happy paths", () => {
  const origRAF = global.requestAnimationFrame;
  const origMedia = navigator.mediaDevices;
  const origPlay = (HTMLMediaElement.prototype as any).play;
  let tracks: Array<{ stop: jest.Mock }>;

  beforeEach(() => {
    // Run rAF callbacks immediately for the scan loop
    (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(0);
      return 0 as unknown as number;
    };
    // Fake camera stream
    tracks = [{ stop: jest.fn() }];
    (navigator as any).mediaDevices = {
      getUserMedia: jest.fn().mockResolvedValue({ getTracks: () => tracks }),
    } as any;
    // Ensure HTMLVideoElement.play resolves
    (HTMLMediaElement.prototype as any).play = jest.fn().mockResolvedValue(undefined);
    // Default mock fetch
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    (global as any).requestAnimationFrame = origRAF;
    (navigator as any).mediaDevices = origMedia as any;
    (HTMLMediaElement.prototype as any).play = origPlay;
    jest.resetAllMocks();
  });

  function installBarcodeDetector(firstCode = "sess1") {
    let called = false;
    (window as any).BarcodeDetector = class {
      constructor(_config: any) {}
      async detect(_video: HTMLVideoElement) {
        if (called) return [];
        called = true;
        return [{ rawValue: firstCode }];
      }
    };
  }

  it("auto-finalizes when no ZIPs required", async () => {
    installBarcodeDetector("auto1");
    render(<Scanner allowedZips={[]} />);
    await waitFor(() => expect(screen.getByText(/Return recorded/)).toBeInTheDocument());
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/returns/mobile",
      expect.objectContaining({ method: "POST" })
    );
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body).toEqual({ sessionId: "auto1" });
    // Camera tracks stopped
    expect(tracks[0].stop).toHaveBeenCalled();
  });

  it("prompts for ZIP and finalizes with selection", async () => {
    installBarcodeDetector("zip1");
    render(<Scanner allowedZips={["12345"]} />);
    // After scan, shows result and ZIP select
    await waitFor(() => expect(screen.getByText(/Scanned: zip1/)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Home pickup ZIP/i), {
      target: { value: "12345" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Finalize/i }));
    await waitFor(() => expect(screen.getByText(/Return recorded/)).toBeInTheDocument());
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body).toEqual({ sessionId: "zip1", zip: "12345" });
  });
});

