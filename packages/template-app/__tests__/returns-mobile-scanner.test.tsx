/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import Scanner from "../src/app/returns/mobile/Scanner";

describe("Scanner", () => {
  it("shows error when scanning unsupported", async () => {
    render(<Scanner allowedZips={[]} />);
    expect(
      await screen.findByText("Scanning not supported on this device."),
    ).toBeInTheDocument();
  });
});

