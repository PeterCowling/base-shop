import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Upgrade from "../src/pages/Upgrade";
import { useRouter } from "next/router";

jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

describe("Upgrade page", () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ query: { id: "shop1" } });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    (global.fetch as jest.Mock).mockReset();
    global.fetch = originalFetch;
  });

  it("loads components, toggles selection, and publishes", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          core: [
            { file: "CompA.tsx", componentName: "CompA" },
            { file: "CompB.tsx", componentName: "CompB" },
          ],
        }),
      })
      .mockResolvedValueOnce({ ok: true, text: async () => "" });

    render(<Upgrade />);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/shop/shop1/component-diff"
    );

    await screen.findByText("core");

    const user = userEvent.setup();
    await user.click(screen.getByLabelText("CompA"));
    expect(screen.getByText("CompA.tsx")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /publish upgrade/i })
    );

    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith(
        "/api/shop/shop1/publish-upgrade",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ components: ["CompA.tsx"] }),
        })
      )
    );

    await screen.findByText("Upgrade published successfully.");
  });

  it("handles component diff fetch failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => "fail",
    });

    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<Upgrade />);

    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith(
        "Failed to load component diff",
        expect.any(Error)
      )
    );

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();

    errorSpy.mockRestore();
  });
});
