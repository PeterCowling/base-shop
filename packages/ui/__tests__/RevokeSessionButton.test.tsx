import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RevokeSessionButton from "../src/components/account/RevokeSessionButton";
import { revoke as revokeSession } from "../src/actions/revokeSession";

jest.mock("../src/actions/revokeSession", () => ({
  __esModule: true,
  revoke: jest.fn(),
}));

const refresh = jest.fn();
jest.mock("next/navigation", () => ({
  __esModule: true,
  useRouter: () => ({ refresh }),
}));

describe("RevokeSessionButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls revokeSession and shows loading state", async () => {
    let resolve: (value: { success: boolean }) => void;
    (revokeSession as jest.Mock).mockReturnValue(
      new Promise((res) => {
        resolve = res;
      })
    );

    render(
      <RevokeSessionButton sessionId="abc" revoke={revokeSession} />
    );

    const button = screen.getByRole("button", { name: "Revoke" });
    await userEvent.click(button);

    expect(revokeSession).toHaveBeenCalledWith("abc");
    await waitFor(() => expect(button).toBeDisabled());
    expect(button).toHaveTextContent("Revoking...");

    resolve!({ success: true });
    await waitFor(() => expect(button).toBeEnabled());
    expect(button).toHaveTextContent("Revoke");
  });
});
