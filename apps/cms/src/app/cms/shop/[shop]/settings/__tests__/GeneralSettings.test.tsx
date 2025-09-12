import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React, { useState, ChangeEvent } from "react";
import GeneralSettings from "../GeneralSettings";

jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Input: (props: any) => <input {...props} />,
    Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
    ),
  }),
  { virtual: true },
);

describe("GeneralSettings", () => {
  const initialInfo = {
    name: "Test Shop",
    themeId: "theme1",
    luxuryFeatures: {
      blog: true,
      contentMerchandising: false,
      raTicketing: true,
      fraudReviewThreshold: 5,
      requireStrongCustomerAuth: false,
      strictReturnConditions: true,
      trackingDashboard: false,
    },
  } as any;

  it("renders initial values", () => {
    render(
      <GeneralSettings
        info={initialInfo}
        setInfo={jest.fn()}
        errors={{}}
        handleChange={jest.fn()}
      />,
    );

    expect(screen.getByLabelText("Name")).toHaveValue("Test Shop");
    expect(screen.getByLabelText("Theme")).toHaveValue("theme1");
    expect(screen.getByLabelText("Enable blog")).toBeChecked();
    expect(screen.getByLabelText("RA ticketing")).toBeChecked();
  });

  it("displays validation errors", () => {
    render(
      <GeneralSettings
        info={initialInfo}
        setInfo={jest.fn()}
        errors={{
          name: ["Required"],
          themeId: ["Invalid"],
        }}
        handleChange={jest.fn()}
      />,
    );

    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.getByText("Invalid")).toBeInTheDocument();
    const nameInput = screen.getByDisplayValue("Test Shop");
    const themeInput = screen.getByDisplayValue("theme1");
    expect(nameInput).toHaveAttribute("aria-invalid", "true");
    expect(themeInput).toHaveAttribute("aria-invalid", "true");
  });

  it("submits edited values via save handler", () => {
    function Wrapper({ onSave }: { onSave: (info: any) => void }) {
      const [info, setInfo] = useState(initialInfo);
      const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
        setInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(info);
          }}
        >
          <GeneralSettings
            info={info}
            setInfo={setInfo}
            errors={{}}
            handleChange={handleChange}
          />
          <button type="submit">Save</button>
        </form>
      );
    }

    const handleSave = jest.fn();
    render(<Wrapper onSave={handleSave} />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Updated Shop" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Updated Shop" }),
    );
  });
});

