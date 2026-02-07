import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CampaignForm } from "../CampaignForm";
import { type CampaignFormValues,defaultCampaignValues } from "../types";

describe("CampaignForm", () => {
  function renderForm(overrides: Partial<React.ComponentProps<typeof CampaignForm>> = {}) {
    return render(
      <CampaignForm
        sections={["basics"]}
        {...overrides}
      />
    );
  }

  it("validates required fields before submission", async () => {
    const onSubmit = jest.fn();
    const onStatusChange = jest.fn();
    const user = userEvent.setup();

    renderForm({ onSubmit, onStatusChange });

    await user.click(screen.getByRole("button", { name: /save campaign/i }));

    expect(onStatusChange).toHaveBeenCalledWith("validating");
    await waitFor(() => expect(onStatusChange).toHaveBeenCalledWith("error"));

    expect(onSubmit).not.toHaveBeenCalled();

    const nameInput = screen.getByLabelText(/campaign name/i);
    expect(nameInput).toHaveAttribute("aria-invalid", "true");

    expect(
      await screen.findByText(/Please review the highlighted fields\./i)
    ).toBeInTheDocument();
  });

  it("submits valid input and surfaces success feedback", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const onStatusChange = jest.fn();
    const user = userEvent.setup();

    renderForm({ onSubmit, onStatusChange });

    await user.type(screen.getByLabelText(/campaign name/i), "Holiday launch");
    await user.type(screen.getByLabelText(/overview/i), "Seasonal promotion details");

    const budgetInput = screen.getByLabelText(/total budget/i);
    await user.clear(budgetInput);
    await user.type(budgetInput, "5000");

    await user.click(screen.getByRole("button", { name: /save campaign/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    const submittedValues = onSubmit.mock.calls[0][0] as CampaignFormValues;
    expect(submittedValues.name).toBe("Holiday launch");
    expect(submittedValues.description).toBe("Seasonal promotion details");
    expect(submittedValues.budget).toBe(5000);

    expect(onStatusChange).toHaveBeenCalledWith("submitting");
    expect(onStatusChange).toHaveBeenCalledWith("success");

    expect(
      await screen.findByText(/Campaign saved successfully\./i)
    ).toBeInTheDocument();
  });

  it("renders server-side validation errors and clears them on change", async () => {
    const user = userEvent.setup();

    renderForm({
      defaultValues: { ...defaultCampaignValues, budget: 10 },
      validationErrors: { budget: "Budget is below the minimum" },
    });

    const budgetInput = screen.getByLabelText(/total budget/i);
    expect(budgetInput).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByText("Budget is below the minimum")
    ).toBeInTheDocument();

    await user.clear(budgetInput);
    await user.type(budgetInput, "150");

    await waitFor(() => {
      expect(screen.queryByText("Budget is below the minimum")).not.toBeInTheDocument();
    });
    expect(budgetInput).toHaveAttribute("aria-invalid", "false");
  });

  it("emits preview updates when values change", async () => {
    const onPreviewChange = jest.fn();
    const user = userEvent.setup();

    renderForm({
      defaultValues: { ...defaultCampaignValues, name: "Initial" },
      onPreviewChange,
    });

    await waitFor(() => expect(onPreviewChange).toHaveBeenCalled());
    onPreviewChange.mockClear();

    await user.clear(screen.getByLabelText(/campaign name/i));
    await user.type(screen.getByLabelText(/campaign name/i), "Summer Campaign");

    await waitFor(() => {
      expect(onPreviewChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ title: "Summer Campaign" })
      );
    });
  });
});
