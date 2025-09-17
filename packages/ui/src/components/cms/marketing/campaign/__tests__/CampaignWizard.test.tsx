import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CampaignWizard } from "../CampaignWizard";
import type { CampaignFormValues } from "../types";

const validValues: CampaignFormValues = {
  name: "Launch Plan",
  objective: "sales",
  description: "Multi-channel launch plan",
  audience: "VIP customers",
  budget: 7500,
  startDate: "2025-03-01",
  endDate: "2025-03-31",
  channels: ["email", "sms"],
  kpi: "Revenue",
};

describe("CampaignWizard", () => {
  it("advances through steps and submits at review", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(<CampaignWizard initialValues={validValues} onSubmit={onSubmit} />);

    expect(screen.getByLabelText(/Campaign name/i)).toHaveValue(validValues.name);

    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(await screen.findByLabelText(/Audience filters/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /continue/i }));
    const reviewButton = await screen.findByRole("button", { name: /review campaign/i });
    await user.click(reviewButton);

    expect(await screen.findByText(/Campaign preview/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /submit for approval/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining(validValues));
    expect(
      await screen.findByText(/Campaign submitted for approval\./i)
    ).toBeInTheDocument();
  });

  it("allows returning to earlier steps", async () => {
    const user = userEvent.setup();

    render(<CampaignWizard initialValues={validValues} />);

    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(await screen.findByLabelText(/Audience filters/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Back$/i }));
    expect(await screen.findByLabelText(/Campaign name/i)).toBeInTheDocument();
  });

  it("propagates preview updates and handles submission errors", async () => {
    const user = userEvent.setup();
    const onPreviewChange = jest.fn();
    const onSubmit = jest.fn().mockRejectedValue(new Error("Network failure"));

    render(
      <CampaignWizard
        initialValues={validValues}
        onSubmit={onSubmit}
        onPreviewChange={onPreviewChange}
      />
    );

    await waitFor(() => expect(onPreviewChange).toHaveBeenCalled());
    onPreviewChange.mockClear();

    await user.clear(screen.getByLabelText(/Campaign name/i));
    await user.type(screen.getByLabelText(/Campaign name/i), "Updated Launch");

    await waitFor(() => {
      expect(onPreviewChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ title: "Updated Launch" })
      );
    });

    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(await screen.findByRole("button", { name: /review campaign/i }));

    await user.click(screen.getByRole("button", { name: /submit for approval/i }));

    expect(await screen.findByText(/Network failure/i)).toBeInTheDocument();
  });
});
