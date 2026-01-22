import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MixerModal from "../MixerModal";

const mixers = [
  "Mixer Tonic Water",
  "Mixer Soda Water",
  "Mixer OJ Mix",
  "Mixer Coke",
  "Mixer Coke Zero",
  "Mixer Sprite",
  "Mixer Espresso",
  "nothing",
];

describe("MixerModal", () => {
  it("renders mixer options and selects one", async () => {
    const onSelect = jest.fn();
    render(<MixerModal onSelect={onSelect} onCancel={jest.fn()} />);

    mixers.forEach((m) => {
      expect(screen.getByRole("button", { name: m })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "Mixer Coke" }));
    expect(onSelect).toHaveBeenCalledWith("Mixer Coke");
  });

  it("calls onCancel when cancel clicked", async () => {
    const onCancel = jest.fn();
    render(<MixerModal onSelect={jest.fn()} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});

