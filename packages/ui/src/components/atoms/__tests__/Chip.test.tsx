import "../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Chip } from "../Chip";
import { TranslationsProvider } from "@acme/i18n";
import en from "@acme/i18n/en.json";

describe("Chip", () => {
  it("respects size prop via Tag", () => {
    render(
      <TranslationsProvider messages={en}>
        <Chip size="lg">Chip</Chip>
      </TranslationsProvider>
    );
    const chip = screen.getByText("Chip");
    expect(chip.className).toContain("px-4");
    expect(chip.className).toContain("py-2");
    expect(chip.className).toContain("text-sm");
  });

  it("renders remove button and calls onRemove when clicked", async () => {
    const handleRemove = jest.fn();
    render(
      <TranslationsProvider messages={en}>
        <Chip onRemove={handleRemove}>Chip</Chip>
      </TranslationsProvider>
    );
    const removeButton = screen.getByRole("button", { name: /remove/i });
    expect(removeButton).toBeInTheDocument();
    await userEvent.click(removeButton);
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });
});
