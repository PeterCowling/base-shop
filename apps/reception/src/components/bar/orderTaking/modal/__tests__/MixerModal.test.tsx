import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

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
    const onSelect = vi.fn();
    render(<MixerModal onSelect={onSelect} onCancel={vi.fn()} />);

    mixers.forEach((m) => {
      expect(screen.getByRole("button", { name: m })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "Mixer Coke" }));
    expect(onSelect).toHaveBeenCalledWith("Mixer Coke");
  });

  it("calls onCancel when cancel clicked", async () => {
    const onCancel = vi.fn();
    render(<MixerModal onSelect={vi.fn()} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});

