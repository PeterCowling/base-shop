import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RevokeSessionButton from "../RevokeSessionButton";

const refresh = jest.fn();
jest.mock("next/navigation", () => ({
  __esModule: true,
  useRouter: () => ({ refresh }),
}));

describe("RevokeSessionButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("revokes session and toggles button state", async () => {
    let resolve: (value: { success: boolean }) => void;
    const revoke = jest
      .fn()
      .mockReturnValue(new Promise((res) => (resolve = res)));

    render(<RevokeSessionButton sessionId="123" revoke={revoke} />);

    const button = screen.getByRole("button", { name: "Revoke" });
    await userEvent.click(button);

    await waitFor(() => expect(button).toBeDisabled());
    expect(button).toHaveTextContent("Revoking...");

    resolve!({ success: true });
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent("Revoke");
  });

  it("shows error message on failed revoke", async () => {
    let resolve: (value: { success: boolean; error: string }) => void;
    const revoke = jest
      .fn()
      .mockReturnValue(new Promise((res) => (resolve = res)));

    render(<RevokeSessionButton sessionId="123" revoke={revoke} />);

    const button = screen.getByRole("button", { name: "Revoke" });
    await userEvent.click(button);

    await waitFor(() => expect(button).toBeDisabled());
    expect(button).toHaveTextContent("Revoking...");

    resolve!({ success: false, error: "msg" });

    expect(await screen.findByText("msg")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent("Revoke");
  });
});
