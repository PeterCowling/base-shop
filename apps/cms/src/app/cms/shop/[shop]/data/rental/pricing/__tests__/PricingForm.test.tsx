import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";

jest.mock("@/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    __esModule: true,
    Button: (() => {
      const Cmp = React.forwardRef<HTMLButtonElement, ComponentProps<"button">>(
        ({ children, ...props }, ref) => (
          <button ref={ref} {...props}>
            {children}
          </button>
        )
      );
      Cmp.displayName = "Button";
      return Cmp;
    })(),
    Card: ({ children, ...props }: ComponentProps<"div">) => (
      <div {...props}>{children}</div>
    ),
    CardContent: ({ children, ...props }: ComponentProps<"div">) => (
      <div {...props}>{children}</div>
    ),
    Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange?.(event.target.checked)}
        {...props}
      />
    ),
    Input: (() => {
      const Cmp = React.forwardRef<HTMLInputElement, ComponentProps<"input">>((props, ref) => (
        <input ref={ref} {...props} />
      ));
      Cmp.displayName = "Input";
      return Cmp;
    })(),
    Textarea: (() => {
      const Cmp = React.forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(
        ({ children, ...props }, ref) => (
          <textarea ref={ref} {...props}>
            {children}
          </textarea>
        )
      );
      Cmp.displayName = "Textarea";
      return Cmp;
    })(),
  };
});

jest.mock("@/components/atoms", () => ({
  __esModule: true,
  Toast: ({ open, message }: { open: boolean; message: string }) =>
    open ? <div role="alert">{message}</div> : null,
  Tag: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

import PricingForm from "../PricingForm";

describe("PricingForm", () => {
  const initial = {
    baseDailyRate: 50,
    durationDiscounts: [
      { minDays: 7, rate: 0.9 },
      { minDays: 30, rate: 0.75 },
    ],
    damageFees: {
      scuff: 20,
      lost: "deposit" as const,
    },
    coverage: {
      scuff: { fee: 5, waiver: 20 },
    },
  };

  beforeEach(() => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }) as unknown as typeof fetch;
  });

  it("surfaces field validation when base rate is missing", async () => {
    render(<PricingForm shop="demo" initial={initial} />);
    const input = screen.getByLabelText(/Base daily rate/i);
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /Save pricing/i }));
    expect(await screen.findByText(/Enter a base daily rate/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("supports editing via advanced JSON tab", async () => {
    render(<PricingForm shop="demo" initial={initial} />);

    fireEvent.click(screen.getByRole("tab", { name: /Advanced JSON/i }));

    const textarea = await screen.findByLabelText(/Pricing JSON configuration/i);
    const next = {
      ...initial,
      baseDailyRate: 75,
      durationDiscounts: [{ minDays: 14, rate: 0.85 }],
    };
    fireEvent.change(textarea, {
      target: { value: JSON.stringify(next, null, 2) },
    });
    fireEvent.click(screen.getByRole("button", { name: /Apply JSON to form/i }));

    fireEvent.click(screen.getByRole("tab", { name: /Guided form/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue("75")).toBeInTheDocument();
      expect(screen.getByDisplayValue("14")).toBeInTheDocument();
    });
  });
});
