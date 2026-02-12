import { fireEvent, render, screen } from "@testing-library/react";

import { recordActivationFunnelEvent } from "../../../../lib/analytics/activationFunnel";
import DigitalAssistantPage from "../page";

jest.mock("../../../../lib/analytics/activationFunnel", () => ({
  recordActivationFunnelEvent: jest.fn(),
}));

describe("DigitalAssistantPage", () => {
  it("TC-01: known question renders answer and further-reading links", () => {
    render(<DigitalAssistantPage />);

    fireEvent.change(screen.getByLabelText("Ask a question"), {
      target: { value: "How do I get around town?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask assistant" }));

    expect(screen.getByText(/Use the Positano Guide/i)).toBeDefined();
    expect(screen.getByText("Further reading")).toBeDefined();
  });

  it("TC-02: records analytics event with answer metadata", () => {
    render(<DigitalAssistantPage />);

    fireEvent.change(screen.getByLabelText("Ask a question"), {
      target: { value: "Where can I order breakfast?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask assistant" }));

    expect(recordActivationFunnelEvent).toHaveBeenCalled();
  });
});
