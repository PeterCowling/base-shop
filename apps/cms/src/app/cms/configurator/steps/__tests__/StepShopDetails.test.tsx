import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import StepShopDetails from "../StepShopDetails";

// mocks for UI components
jest.mock("@acme/ui/components/atoms/shadcn", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Input: ({ "data-cy": dataCy, ...props }: any) => (
    <input data-testid={dataCy} data-cy={dataCy} {...props} />
  ),
  Select: ({ value, onValueChange, children, ...props }: any) => (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      {...props}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectValue: () => null,
}));

jest.mock("@acme/ui/components/cms/page-builder/ImagePicker", () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

// mocks for configurator hook
const markComplete = jest.fn();
const push = jest.fn();

jest.mock("../hooks/useConfiguratorStep", () => ({
  __esModule: true,
  default: ({ values }: any) => {
    const errors: Record<string, string> = {};
    if (!values.id) errors.id = "Required";
    else if (!/^[a-z0-9-]+$/.test(values.id))
      errors.id = "Lowercase letters, numbers, and dashes only";
    if (!values.name) errors.name = "Required";
    for (const [k, v] of Object.entries(values.logo || {})) {
      try {
        if (v) new URL(v);
      } catch {
        errors[`logo.${k}`] = "Invalid URL";
      }
    }
    if (!values.contactInfo)
      errors.contactInfo = "Required";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.contactInfo))
      errors.contactInfo = "Invalid email";
    const isValid = Object.keys(errors).length === 0;
    return {
      router: { push },
      markComplete,
      getError: (field: string) => errors[field],
      isValid,
    };
  },
}));

let setLogoState: React.Dispatch<React.SetStateAction<Record<string, string>>> = () => {
  throw new Error("setLogoState called before initialization");
};

function Wrapper() {
  const [shopId, setShopId] = React.useState("");
  const [storeName, setStoreName] = React.useState("");
  const [logo, setLogo] = React.useState<Record<string, string>>({
    "desktop-landscape": "invalid",
  });
  setLogoState = setLogo;
  const [contactInfo, setContactInfo] = React.useState("");
  return (
    <StepShopDetails
      shopId={shopId}
      setShopId={setShopId}
      storeName={storeName}
      setStoreName={setStoreName}
      logo={logo}
      setLogo={setLogo}
      contactInfo={contactInfo}
      setContactInfo={setContactInfo}
      templates={["default"]}
    />
  );
}

describe("StepShopDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows errors for invalid input and disables submit", () => {
    render(<Wrapper />);
    expect(screen.getAllByText("Required")).toHaveLength(3);
    expect(screen.getByText("Invalid URL")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save & return" }),
    ).toBeDisabled();
  });

  it("removes errors and enables submit when inputs valid", () => {
    render(<Wrapper />);
    fireEvent.change(screen.getByTestId("shop-id"), {
      target: { value: "my-shop" },
    });
    fireEvent.change(screen.getByTestId("store-name"), {
      target: { value: "My Store" },
    });
    act(() => {
      setLogoState((prev) => ({
        ...prev,
        "desktop-landscape": "https://example.com/logo.png",
      }));
    });
    fireEvent.change(screen.getByTestId("contact-info"), {
      target: { value: "contact@example.com" },
    });

    expect(screen.queryByText("Invalid URL")).not.toBeInTheDocument();
    expect(screen.queryByText("Required")).not.toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Save & return" });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(markComplete).toHaveBeenCalledWith(true);
    expect(push).toHaveBeenCalledWith("/cms/configurator");
  });
});

