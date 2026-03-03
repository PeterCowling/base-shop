import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { useUnifiedBookingData } from "../../../../hooks/dataOrchestrator/useUnifiedBookingData";
import { recordActivationFunnelEvent } from "../../../../lib/analytics/activationFunnel";
import DigitalAssistantPage from "../page";

jest.mock("../../../../lib/analytics/activationFunnel", () => ({
  recordActivationFunnelEvent: jest.fn(),
}));

jest.mock("../../../../hooks/dataOrchestrator/useUnifiedBookingData", () => ({
  useUnifiedBookingData: jest.fn(),
}));

const mockedUseUnifiedBookingData = useUnifiedBookingData as jest.MockedFunction<
  typeof useUnifiedBookingData
>;

describe("DigitalAssistantPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseUnifiedBookingData.mockReturnValue({ occupantData: null } as any);
    localStorage.setItem("prime_guest_token", "test-token");
    localStorage.setItem("prime_guest_uuid", "test-uuid");
  });

  afterEach(() => {
    localStorage.clear();
  });

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

  it("TC-07: keyword match does not trigger fetch call", () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    render(<DigitalAssistantPage />);

    fireEvent.change(screen.getByLabelText("Ask a question"), {
      target: { value: "How do I book an activity?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask assistant" }));

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("TC-08: unmatched query triggers fetch and renders LLM answer", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        answer: "Our hostel has a beautiful rooftop terrace.",
        answerType: "llm",
        links: [],
        category: "general",
        durationMs: 123,
      }),
    } as unknown as Response);

    render(<DigitalAssistantPage />);

    fireEvent.change(screen.getByLabelText("Ask a question"), {
      target: { value: "What is the rooftop terrace like?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask assistant" }));

    await waitFor(() => {
      expect(screen.getByText(/beautiful rooftop terrace/i)).toBeDefined();
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/assistant-query",
      expect.objectContaining({ method: "POST" }),
    );
    fetchSpy.mockRestore();
  });

  it("TC-09: 429 response shows friendly rate-limit message", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 429,
    } as unknown as Response);

    render(<DigitalAssistantPage />);

    fireEvent.change(screen.getByLabelText("Ask a question"), {
      target: { value: "Can you recommend a nice hike?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask assistant" }));

    await waitFor(() => {
      expect(screen.getByText(/Too many questions/i)).toBeDefined();
    });
    fetchSpy.mockRestore();
  });

  it("TC-10: preset button click submits the preset query via fetch", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        answer: "The beach is nearby.",
        answerType: "llm",
        links: [],
        category: "general",
        durationMs: 50,
      }),
    } as unknown as Response);

    render(<DigitalAssistantPage />);

    fireEvent.click(
      screen.getByRole("button", { name: "How do I walk to Fornillo beach?" }),
    );

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/assistant-query",
        expect.objectContaining({
          body: expect.stringContaining("Fornillo beach"),
        }),
      );
    });
    fetchSpy.mockRestore();
  });
});
