import { render, screen } from "@testing-library/react";
import { CampaignPreviewPanel } from "../CampaignPreviewPanel";
import type { CampaignPreviewData } from "../types";

const samplePreview: CampaignPreviewData = {
  title: "Holiday Campaign",
  objective: "awareness",
  timeframe: "2025-11-01 → 2025-11-30",
  audienceSummary: "Returning customers in the loyalty program",
  channels: ["email", "social"],
  budgetLabel: "$12,000",
  kpi: "Engagement",
};

describe("CampaignPreviewPanel", () => {
  it("renders campaign summary details", () => {
    render(<CampaignPreviewPanel data={samplePreview} />);

    expect(
      screen.getByRole("heading", { name: /Campaign preview/i })
    ).toBeInTheDocument();
    expect(screen.getByText(samplePreview.title)).toBeInTheDocument();
    expect(screen.getByText(samplePreview.objective)).toBeInTheDocument();
    expect(screen.getByText(samplePreview.timeframe)).toBeInTheDocument();
    expect(screen.getByText(samplePreview.budgetLabel)).toBeInTheDocument();
    expect(screen.getByText(samplePreview.audienceSummary)).toBeInTheDocument();
    expect(screen.getByText(samplePreview.kpi)).toBeInTheDocument();

    samplePreview.channels.forEach((channel) => {
      expect(screen.getByText(channel)).toBeInTheDocument();
    });
  });

  it("renders supplied actions", () => {
    render(
      <CampaignPreviewPanel
        data={samplePreview}
        actions={<button type="button">Edit preview</button>}
      />
    );

    expect(screen.getByRole("button", { name: /Edit preview/i })).toBeInTheDocument();
  });
});
