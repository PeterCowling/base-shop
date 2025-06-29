import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Wizard from "../src/app/cms/wizard/Wizard";

describe("Wizard", () => {
  const themes = ["base", "dark"];
  const templates = ["template-app"];

  beforeEach(() => {
    (global.fetch as any) = jest.fn(() => Promise.resolve({ ok: true }));
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
});
