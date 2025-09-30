import "../../../../../../../test/resetNextMocks";
import { fireEvent, render, screen } from "@testing-library/react";
import ImageSourcePanel from "../ImageSourcePanel";
const useTranslationsMock = jest.fn(() => (key: string) => key);

jest.mock("@acme/i18n", () => ({
  __esModule: true,
  useTranslations: () => useTranslationsMock(),
}));

const probe = jest.fn();
let probeState = { loading: false, error: "", valid: true };

jest.mock("../../../../hooks/useRemoteImageProbe", () => ({
  __esModule: true,
  default: () => ({ probe, ...probeState }),
}));

jest.mock("../ImagePicker", () => ({
  __esModule: true,
  default: ({ onSelect, children }: any) => (
    <button type="button" onClick={() => onSelect("picked")}>
      {children}
    </button>
  ),
}));

describe("ImageSourcePanel", () => {
  beforeEach(() => {
    probe.mockClear();
    probeState = { loading: false, error: "", valid: true };
  });

  it("updates url and selects image", () => {
    const onChange = jest.fn();
    render(<ImageSourcePanel onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText("cms.image.url"), {
      target: { value: "http://img" },
    });
    expect(onChange).toHaveBeenCalledWith({ src: "http://img" });
    expect(probe).toHaveBeenCalledWith("http://img");

    fireEvent.click(screen.getByText("cms.image.upload"));
    expect(onChange).toHaveBeenCalledWith({ src: "picked" });
  });

  it("handles alt text and decorative toggle", () => {
    const onChange = jest.fn();
    render(<ImageSourcePanel onChange={onChange} />);
    const altInput = screen.getByPlaceholderText("cms.image.alt");
    expect(screen.getByText("cms.image.altWarning")).toBeInTheDocument();
    fireEvent.change(altInput, { target: { value: "desc" } });
    expect(onChange).toHaveBeenCalledWith({ alt: "desc" });
    fireEvent.click(screen.getByText("cms.image.decorative"));
    expect(onChange).toHaveBeenCalledWith({ alt: "" });
    expect(altInput).toBeDisabled();
    expect(screen.queryByText("cms.image.altWarning")).not.toBeInTheDocument();
  });

});

afterAll(() => {
  jest.restoreAllMocks();
});
