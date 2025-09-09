import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StepShopDetails from "../StepShopDetails";

// mocks for UI components
jest.mock("@ui/components/atoms/shadcn", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Input: (props: any) => <input {...props} />,
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

jest.mock("@ui", () => ({
  ImagePicker: ({ children }: any) => <div>{children}</div>,
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
    for (const [viewport, orientations] of Object.entries(values.logo)) {
      for (const [orientation, url] of Object.entries(
        orientations as Record<string, string>,
      )) {
        try {
          new URL(url as string);
        } catch {
          errors[`logo.${viewport}.${orientation}`] = "Invalid URL";
        }
      }
    }
    if (!values.contactInfo) errors.contactInfo = "Required";
    if (!["sale", "rental"].includes(values.type)) errors.type = "Required";
    if (!values.template) errors.template = "Required";
    const isValid = Object.keys(errors).length === 0;
    return {
      router: { push },
      markComplete,
      getError: (field: string) => errors[field],
      isValid,
    };
  },
}));

function Wrapper() {
  const [shopId, setShopId] = React.useState("");
  const [storeName, setStoreName] = React.useState("");
  const [logo, setLogo] = React.useState({
    desktop: { landscape: "invalid", portrait: "invalid" },
    mobile: { landscape: "invalid", portrait: "invalid" },
  });
  const [contactInfo, setContactInfo] = React.useState("");
  const [type, setType] = React.useState("");
  const [template, setTemplate] = React.useState("");
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
      type={type}
      setType={setType}
      template={template}
      setTemplate={setTemplate}
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
    expect(screen.getAllByText("Required")).toHaveLength(5);
    expect(screen.getAllByText("Invalid URL")).toHaveLength(4);
    expect(screen.getByTestId("save-return")).toBeDisabled();
  });

  it("removes errors and enables submit when inputs valid", () => {
    render(<Wrapper />);
    fireEvent.change(screen.getByTestId("shop-id"), {
      target: { value: "my-shop" },
    });
    fireEvent.change(screen.getByTestId("store-name"), {
      target: { value: "My Store" },
    });
    fireEvent.change(screen.getByTestId("logo-desktop-landscape"), {
      target: { value: "https://example.com/logo.png" },
    });
    fireEvent.change(screen.getByTestId("logo-desktop-portrait"), {
      target: { value: "https://example.com/logo.png" },
    });
    fireEvent.change(screen.getByTestId("logo-mobile-landscape"), {
      target: { value: "https://example.com/logo.png" },
    });
    fireEvent.change(screen.getByTestId("logo-mobile-portrait"), {
      target: { value: "https://example.com/logo.png" },
    });
    fireEvent.change(screen.getByTestId("contact-info"), {
      target: { value: "contact@example.com" },
    });
    fireEvent.change(screen.getByTestId("shop-type"), {
      target: { value: "sale" },
    });
    fireEvent.change(screen.getByTestId("template"), {
      target: { value: "default" },
    });

    expect(screen.queryByText("Invalid URL")).not.toBeInTheDocument();
    expect(screen.queryByText("Required")).not.toBeInTheDocument();
    const button = screen.getByTestId("save-return");
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(markComplete).toHaveBeenCalledWith(true);
    expect(push).toHaveBeenCalledWith("/cms/configurator");
  });
});

