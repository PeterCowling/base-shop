import { act, fireEvent, render, screen } from "@testing-library/react";
import StepHomePage from "../src/app/cms/wizard/steps/StepHomePage";
import { fetchJson } from "@shared-utils";

jest.mock("@/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    __esModule: true,
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Select: ({ value, onValueChange, children }: any) => (
      <select value={value} onChange={(e) => onValueChange(e.target.value)}>
        {children}
      </select>
    ),
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
    SelectTrigger: ({ children }: any) => <>{children}</>,
    SelectValue: ({ placeholder }: any) => (
      <option disabled value="">
        {placeholder}
      </option>
    ),
  };
});

jest.mock("@/components/cms/PageBuilder", () => {
  const React = require("react");
  return function PageBuilder({ onSave, onPublish }: any) {
    return (
      <div>
        <button onClick={() => onSave(new FormData())}>save</button>
        <button onClick={() => onPublish(new FormData())}>publish</button>
      </div>
    );
  };
});

jest.mock("@shared-utils");

const defaultProps = {
  pageTemplates: [],
  homeLayout: "",
  setHomeLayout: jest.fn(),
  components: [],
  setComponents: jest.fn(),
  homePageId: null,
  setHomePageId: jest.fn(),
  shopId: "shop",
  themeStyle: {},
  onBack: jest.fn(),
  onNext: jest.fn(),
};

describe("StepHomePage notifications", () => {
  beforeEach(() => {
    (fetchJson as jest.Mock).mockReset();
  });

  it("shows success toast on publish", async () => {
    (fetchJson as jest.Mock).mockResolvedValueOnce([]); // initial load
    (fetchJson as jest.Mock).mockResolvedValueOnce({ id: "1" }); // publish
    render(<StepHomePage {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByText("publish"));
    });
    await screen.findByText(/page published/i);
  });

  it("shows error toast on publish failure", async () => {
    (fetchJson as jest.Mock).mockResolvedValueOnce([]); // initial load
    (fetchJson as jest.Mock).mockRejectedValueOnce(new Error("err"));
    render(<StepHomePage {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByText("publish"));
    });
    await screen.findByText(/failed to publish page/i);
  });
});
