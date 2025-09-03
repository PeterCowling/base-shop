import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ConnectForm from "../ConnectForm.client";

jest.mock("@cms/actions/saveSanityConfig", () => ({
  saveSanityConfig: jest.fn(),
}));

jest.mock("@cms/actions/deleteSanityConfig", () => ({
  deleteSanityConfig: jest.fn().mockResolvedValue({}),
}));

jest.mock("@ui", () => ({
  Toast: ({ open, message }: any) => (open ? <div role="alert">{message}</div> : null),
}));

describe("ConnectForm dataset step", () => {
  const { saveSanityConfig } = require("@cms/actions/saveSanityConfig");

  beforeEach(() => {
    (global.fetch as any) = jest.fn();
    (saveSanityConfig as jest.Mock).mockReset();
    process.env.NODE_ENV = "test";
  });

  async function goToDatasetStep(verifyResponse: any) {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => verifyResponse,
    });
    render(<ConnectForm shopId="shop" />);
    fireEvent.change(screen.getByLabelText(/project id/i), { target: { value: "p" } });
    fireEvent.change(screen.getByLabelText(/token/i), { target: { value: "t" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /verify/i }));
    });
    await screen.findByText(/credentials verified/i);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
  }

  it("lists existing datasets", async () => {
    await goToDatasetStep({ ok: true, datasets: ["blog"] });
    const select = screen.getByLabelText(/dataset/i) as HTMLSelectElement;
    expect(select).toHaveValue("blog");
  });

  it("prevents submission on invalid dataset name", async () => {
    await goToDatasetStep({ ok: true, datasets: [] });
    fireEvent.change(screen.getByLabelText(/dataset/i), {
      target: { value: "__add__" },
    });
    const input = screen.getByLabelText(/dataset/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(saveSanityConfig).not.toHaveBeenCalled();
    expect(input.validationMessage).not.toBe("");
  });

});

