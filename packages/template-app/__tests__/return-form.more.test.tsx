/** @jest-environment jsdom */
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ReturnForm from "../src/app/account/returns/ReturnForm";

describe("ReturnForm extras", () => {
  const origMedia = navigator.mediaDevices;
  const origPlay = (HTMLMediaElement.prototype as any).play;

  beforeEach(() => {
    (HTMLMediaElement.prototype as any).play = jest.fn().mockResolvedValue(undefined);
  });
  afterEach(() => {
    (navigator as any).mediaDevices = origMedia as any;
    (HTMLMediaElement.prototype as any).play = origPlay;
    jest.resetAllMocks();
  });

  it("shows camera error when access fails", async () => {
    // Ensure BarcodeDetector exists so code attempts to access camera
    (window as any).BarcodeDetector = class {
      constructor(_config: any) {}
      async detect() { return []; }
    };
    (navigator as any).mediaDevices = {
      getUserMedia: jest.fn().mockRejectedValue(new Error("denied")),
    } as any;
    render(<ReturnForm />);
    await waitFor(() =>
      expect(screen.getByText("account.returns.form.cameraError")).toBeInTheDocument()
    );
  });

  it("submits without tracking block when disabled", async () => {
    (navigator as any).mediaDevices = {
      getUserMedia: jest.fn().mockResolvedValue({ getTracks: () => [{ stop: jest.fn() }] }),
    } as any;
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ labelUrl: "url", tracking: "123" }),
    });
    render(<ReturnForm />);
    fireEvent.change(screen.getByPlaceholderText("account.returns.form.sessionIdPlaceholder"), {
      target: { value: "sess" },
    });
    fireEvent.submit(screen.getByText("account.returns.form.submit").closest("form")!);
    // No Print Label link since tracking is disabled
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.queryByText("account.returns.form.printLabel")).toBeNull();
  });
});
