/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import ReturnForm from "../src/app/account/returns/ReturnForm";
import ReturnsPage from "../src/app/account/returns/page";
import { getReturnLogistics, getReturnBagAndLabel } from "@platform-core/returnLogistics";
import { getShopSettings } from "@platform-core/repositories/settings.server";

// ---------- ReturnForm tests ----------

describe("ReturnForm", () => {
  it("submits and shows label and tracking", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ labelUrl: "url", tracking: "123" }),
    }) as any;
    render(<ReturnForm bagType="poly" tracking />);
    fireEvent.change(screen.getByPlaceholderText("Session ID"), {
      target: { value: "abc" },
    });
    const form = screen.getByText("Submit").closest("form")!;
    fireEvent.submit(form);
    await waitFor(() => expect(screen.getByText(/Print Label/)).toBeInTheDocument());
    expect(screen.getByText(/Tracking: 123/)).toBeInTheDocument();
  });
});

// ---------- ReturnsPage tests ----------

jest.mock("@platform-core/returnLogistics", () => ({
  getReturnLogistics: jest.fn(),
  getReturnBagAndLabel: jest.fn(),
}));

jest.mock("@platform-core/repositories/settings.server", () => ({
  getShopSettings: jest.fn(),
}));

jest.mock("../src/components/CleaningInfo", () => {
  function CleaningInfoMock() {
    return <div data-testid="clean" />;
  }
  return CleaningInfoMock;
});
jest.mock("../shop.json", () => ({ showCleaningTransparency: true }), { virtual: true });

describe("ReturnsPage", () => {
  it("shows message when mobile returns disabled", async () => {
    (getReturnLogistics as jest.Mock).mockResolvedValue({ mobileApp: false });
    const ui = (await ReturnsPage()) as ReactElement;
    render(ui);
    expect(screen.getByText(/Mobile returns are not enabled/)).toBeInTheDocument();
  });

  it("renders form with bag and tracking", async () => {
    (getReturnLogistics as jest.Mock).mockResolvedValue({ mobileApp: true });
    (getReturnBagAndLabel as jest.Mock).mockResolvedValue({ bagType: "poly", tracking: true });
    (getShopSettings as jest.Mock).mockResolvedValue({ returnService: { bagEnabled: true } });
    const ui = (await ReturnsPage()) as ReactElement;
    const [form, clean] = ui.props.children;
    expect(form.props.bagType).toBe("poly");
    expect(form.props.tracking).toBe(true);
    expect(clean).toBeTruthy();
  });
});
