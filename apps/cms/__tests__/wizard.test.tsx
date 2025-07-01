import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Wizard from "../src/app/cms/wizard/Wizard";

describe("Wizard", () => {
  const themes = ["base", "dark"];
  const templates = ["template-app"];

  beforeEach(() => {
    (global.fetch as any) = jest.fn(() => Promise.resolve({ ok: true }));
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it("submits after navigating steps", async () => {
    render(<Wizard themes={themes} templates={templates} />);

    fireEvent.change(screen.getByPlaceholderText("my-shop"), {
      target: { value: "testshop" },
    });
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));

    fireEvent.click(screen.getByText("Create Shop"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("loads tokens for a newly added theme", async () => {
    const { container } = render(
      <Wizard themes={["base", "abc"]} templates={templates} />
    );

    fireEvent.change(screen.getByPlaceholderText("my-shop"), {
      target: { value: "shop" },
    });
    fireEvent.click(screen.getByText("Next"));
    // open dropdown
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(await screen.findByText("abc"));

    await waitFor(() => {
      const root = container.firstChild as HTMLElement;
      expect(root.style.getPropertyValue("--color-primary")).toBe(
        "160 80% 40%"
      );
    });
  });
});
